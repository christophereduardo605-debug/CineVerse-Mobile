
require("dotenv").config();

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// ======================================
// CONSULTAR API DO TMDB
// ======================================

async function consultarTMDB(endpoint) {
    const token = process.env.TMDB_ACCESS_TOKEN;

    if (!token) {
        throw new Error("Token do TMDB não configurado no .env");
    }

    const resposta = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json"
        }
    });

    if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(`Erro TMDB (${resposta.status}): ${erro}`);
    }

    return resposta.json();
}

// ======================================
// VALIDAR ID DO TMDB
// ======================================

function validarIdTMDB(id) {
    const idNumerico = Number(id);

    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
        throw new Error(`ID inválido recebido pelo TMDB: ${id}`);
    }

    return idNumerico;
}

// ======================================
// PADRONIZAR FILMES
// ======================================

function formatarFilme(filme) {
    return {
        tmdb_id: filme.id,
        titulo: filme.title || filme.original_title,
        descricao: filme.overview || "",
        ano: filme.release_date
            ? Number(filme.release_date.substring(0, 4))
            : null,
        imagem: filme.poster_path
            ? `${IMAGE_BASE_URL}${filme.poster_path}`
            : null,
        tipo: "Filme"
    };
}

// ======================================
// PADRONIZAR SÉRIES
// ======================================

function formatarSerie(serie) {
    return {
        tmdb_id: serie.id,
        titulo: serie.name || serie.original_name,
        descricao: serie.overview || "",
        ano: serie.first_air_date
            ? Number(serie.first_air_date.substring(0, 4))
            : null,
        imagem: serie.poster_path
            ? `${IMAGE_BASE_URL}${serie.poster_path}`
            : null,
        tipo: "Série"
    };
}

// ======================================
// FORMATAR RESPOSTA PAGINADA
// ======================================

function formatarRespostaPaginada(dados, formatador = formatarSerie) {
    const pagina = Number(dados.page) || 1;

    const totalPaginas = Math.min(
        Number(dados.total_pages) || 1,
        500
    );

    return {
        pagina,
        total_paginas: totalPaginas,
        total_resultados: Number(dados.total_results) || 0,
        tem_mais: pagina < totalPaginas,
        resultados: (dados.results || []).map(formatador)
    };
}

// ======================================
// VALIDAR PÁGINA
// ======================================

function validarPagina(pagina) {
    return Math.max(1, Math.min(500, Number(pagina) || 1));
}

// ======================================
// CATÁLOGO GERAL DE FILMES
// ======================================

async function buscarCatalogoFilmesTMDB(pagina = 1) {
    const paginaValida = validarPagina(pagina);

    const parametros = new URLSearchParams({
        language: "pt-BR",
        region: "BR",
        include_adult: "false",
        sort_by: "popularity.desc",
        page: String(paginaValida)
    });

    const dados = await consultarTMDB(
        `/discover/movie?${parametros}`
    );

    return formatarRespostaPaginada(dados, formatarFilme);
}

// ======================================
// CATÁLOGO GERAL DE SÉRIES
// ======================================

async function buscarCatalogoSeriesTMDB(pagina = 1) {
    const paginaValida = validarPagina(pagina);

    const parametros = new URLSearchParams({
        language: "pt-BR",
        include_adult: "false",
        sort_by: "popularity.desc",
        page: String(paginaValida)
    });

    const dados = await consultarTMDB(
        `/discover/tv?${parametros}`
    );

    return formatarRespostaPaginada(dados, formatarSerie);
}

// ======================================
// FILMES POPULARES PAGINADOS
// ======================================

async function buscarFilmesPopularesPaginadosTMDB(pagina = 1) {
    const paginaValida = validarPagina(pagina);

    const dados = await consultarTMDB(
        `/movie/popular?language=pt-BR&region=BR&page=${paginaValida}`
    );

    return formatarRespostaPaginada(dados, formatarFilme);
}

// ======================================
// LANÇAMENTOS PAGINADOS
// ======================================

async function buscarLancamentosPaginadosTMDB(pagina = 1) {
    const paginaValida = validarPagina(pagina);

    const dados = await consultarTMDB(
        `/movie/now_playing?language=pt-BR&region=BR&page=${paginaValida}`
    );

    return formatarRespostaPaginada(dados, formatarFilme);
}

// ======================================
// FILMES EM ALTA PAGINADOS
// ======================================

async function buscarFilmesEmAltaPaginadosTMDB(pagina = 1) {
    const paginaValida = validarPagina(pagina);

    const dados = await consultarTMDB(
        `/trending/movie/week?language=pt-BR&page=${paginaValida}`
    );

    return formatarRespostaPaginada(dados, formatarFilme);
}

// ======================================
// PESQUISAR FILMES
// ======================================

async function buscarFilmesTMDB(busca) {
    const parametros = new URLSearchParams({
        query: busca,
        language: "pt-BR",
        include_adult: "false"
    });

    const dados = await consultarTMDB(
        `/search/movie?${parametros}`
    );

    return dados.results.map(formatarFilme);
}

// ======================================
// PESQUISAR SÉRIES COM PAGINAÇÃO
// ======================================

async function buscarSeriesTMDB(busca, pagina = 1) {
    const paginaValida = validarPagina(pagina);

    const parametros = new URLSearchParams({
        query: busca,
        language: "pt-BR",
        include_adult: "false",
        page: String(paginaValida)
    });

    const dados = await consultarTMDB(
        `/search/tv?${parametros}`
    );

    return formatarRespostaPaginada(dados);
}

// ======================================
// SÉRIES POPULARES
// ======================================

async function buscarSeriesPopularesTMDB() {
    const dados = await consultarTMDB(
        "/tv/popular?language=pt-BR&page=1"
    );

    return dados.results.map(formatarSerie);
}

// ======================================
// SÉRIES POPULARES PAGINADAS
// ======================================

async function buscarSeriesPopularesPaginadasTMDB(pagina = 1) {
    const paginaValida = validarPagina(pagina);

    const dados = await consultarTMDB(
        `/tv/popular?language=pt-BR&page=${paginaValida}`
    );

    return formatarRespostaPaginada(dados);
}

// ======================================
// SÉRIES EM ALTA
// ======================================

async function buscarSeriesEmAltaTMDB() {
    const dados = await consultarTMDB(
        "/trending/tv/week?language=pt-BR"
    );

    return dados.results.map(formatarSerie);
}

// ======================================
// SÉRIES EM ALTA PAGINADAS
// ======================================

async function buscarSeriesEmAltaPaginadasTMDB(pagina = 1) {
    const paginaValida = validarPagina(pagina);

    const dados = await consultarTMDB(
        `/trending/tv/week?language=pt-BR&page=${paginaValida}`
    );

    return formatarRespostaPaginada(dados);
}

// ======================================
// FILMES ALEATÓRIOS
// ======================================

async function buscarFilmesAleatoriosTMDB() {
    const pagina = Math.floor(Math.random() * 5) + 1;

    const dados = await consultarTMDB(
        `/movie/popular?language=pt-BR&region=BR&page=${pagina}`
    );

    const filmes = dados.results.map(formatarFilme);

    for (let i = filmes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filmes[i], filmes[j]] = [filmes[j], filmes[i]];
    }

    return filmes.slice(0, 10);
}

// ======================================
// LANÇAMENTOS
// ======================================

async function buscarLancamentosTMDB() {
    const dados = await consultarTMDB(
        "/movie/now_playing?language=pt-BR&region=BR&page=1"
    );

    return dados.results.map(formatarFilme);
}

// ======================================
// FILMES EM ALTA
// ======================================

async function buscarFilmesEmAltaTMDB() {
    const dados = await consultarTMDB(
        "/trending/movie/week?language=pt-BR"
    );

    return dados.results.map(formatarFilme);
}

// ======================================
// DETALHES DE FILME
// ======================================

async function buscarDetalhesFilmeTMDB(id) {
    console.log("======================================");
    console.log("CINEVERSE - CONSULTA DE DETALHES TMDB");
    console.log("ID recebido:", id);
    console.log("Tipo do ID:", typeof id);
    console.log("======================================");

    const idValido = validarIdTMDB(id);

    const dados = await consultarTMDB(
        `/movie/${idValido}?language=pt-BR`
    );

    console.log("Filme encontrado no TMDB:", dados.title);
    console.log("ID confirmado pelo TMDB:", dados.id);

    return formatarFilme(dados);
}

// ======================================
// SELECIONAR TRAILER DO YOUTUBE
// ======================================

function selecionarTrailer(videos) {
    const videosYoutube = (videos || []).filter((video) =>
        video.site === "YouTube" &&
        video.type === "Trailer" &&
        video.key
    );

    const trailer =
        videosYoutube.find((video) => video.official === true) ||
        videosYoutube[0];

    if (!trailer) {
        return null;
    }

    return {
        nome: trailer.name,
        chave: trailer.key,
        site: trailer.site,
        tipo: trailer.type,
        idioma: trailer.iso_639_1,
        oficial: trailer.official || false,
        url: `https://www.youtube.com/watch?v=${trailer.key}`
    };
}

// ======================================
// BUSCAR TRAILER COM IDIOMAS ALTERNATIVOS
// ======================================

async function consultarTrailerTMDB(endpoint) {
    const portugues = await consultarTMDB(
        `${endpoint}?language=pt-BR`
    );

    let trailer = selecionarTrailer(portugues.results);

    if (trailer) return trailer;

    const ingles = await consultarTMDB(
        `${endpoint}?language=en-US`
    );

    trailer = selecionarTrailer(ingles.results);

    if (trailer) return trailer;

    const todos = await consultarTMDB(
        `${endpoint}?language=`
    );

    return selecionarTrailer(todos.results);
}

// ======================================
// TRAILERS
// ======================================

async function buscarTrailerFilmeTMDB(id) {
    const idValido = validarIdTMDB(id);

    return await consultarTrailerTMDB(
        `/movie/${idValido}/videos`
    );
}

async function buscarTrailerSerieTMDB(id) {
    const idValido = validarIdTMDB(id);

    return await consultarTrailerTMDB(
        `/tv/${idValido}/videos`
    );
}

async function buscarTrailerTemporadaTMDB(id, numeroTemporada) {
    const idValido = validarIdTMDB(id);

    return await consultarTrailerTMDB(
        `/tv/${idValido}/season/${encodeURIComponent(numeroTemporada)}/videos`
    );
}

// ======================================
// ONDE ASSISTIR AO FILME NO BRASIL
// ======================================

async function buscarOndeAssistirFilmeTMDB(id) {
    const idValido = validarIdTMDB(id);

    const dados = await consultarTMDB(
        `/movie/${idValido}/watch/providers`
    );

    const brasil = dados.results?.BR;

    return {
        link: brasil?.link ||
            `https://www.themoviedb.org/movie/${idValido}/watch?locale=BR`,
        assinatura: brasil?.flatrate || [],
        aluguel: brasil?.rent || [],
        compra: brasil?.buy || [],
        gratuito: brasil?.free || [],
        com_anuncios: brasil?.ads || []
    };
}

// ======================================
// DETALHES DE SÉRIE
// ======================================

async function buscarDetalhesSerieTMDB(id) {
    const idValido = validarIdTMDB(id);

    const dados = await consultarTMDB(
        `/tv/${idValido}?language=pt-BR`
    );

    return {
        tmdb_id: dados.id,
        titulo: dados.name,
        descricao: dados.overview || "",
        ano: dados.first_air_date
            ? Number(dados.first_air_date.substring(0, 4))
            : null,
        imagem: dados.poster_path
            ? `${IMAGE_BASE_URL}${dados.poster_path}`
            : null,
        temporadas: (dados.seasons || []).map((temporada) => ({
            id: temporada.id,
            numero: temporada.season_number,
            titulo: temporada.name,
            descricao: temporada.overview || "",
            quantidade_episodios: temporada.episode_count
        }))
    };
}

// ======================================
// EPISÓDIOS DE UMA TEMPORADA
// ======================================

async function buscarTemporadaTMDB(id, numeroTemporada) {
    const idValido = validarIdTMDB(id);

    const dados = await consultarTMDB(
        `/tv/${idValido}/season/${encodeURIComponent(numeroTemporada)}?language=pt-BR`
    );

    return {
        numero: dados.season_number,
        titulo: dados.name,
        episodios: (dados.episodes || []).map((episodio) => ({
            tmdb_id: episodio.id,
            numero: episodio.episode_number,
            titulo: episodio.name,
            descricao: episodio.overview || "",
            duracao: episodio.runtime || null,
            imagem: episodio.still_path
                ? `${IMAGE_BASE_URL}${episodio.still_path}`
                : null
        }))
    };
}

// ======================================
// EXPORTAR FUNÇÕES
// ======================================

module.exports = {
    buscarCatalogoFilmesTMDB,
    buscarCatalogoSeriesTMDB,

    buscarFilmesPopularesPaginadosTMDB,
    buscarLancamentosPaginadosTMDB,
    buscarFilmesEmAltaPaginadosTMDB,

    buscarFilmesTMDB,
    buscarSeriesTMDB,
    buscarSeriesPopularesTMDB,
    buscarSeriesEmAltaTMDB,
    buscarSeriesPopularesPaginadasTMDB,
    buscarSeriesEmAltaPaginadasTMDB,

    buscarFilmesAleatoriosTMDB,
    buscarLancamentosTMDB,
    buscarFilmesEmAltaTMDB,

    buscarDetalhesFilmeTMDB,
    buscarTrailerFilmeTMDB,
    buscarTrailerSerieTMDB,
    buscarTrailerTemporadaTMDB,
    buscarOndeAssistirFilmeTMDB,
    buscarDetalhesSerieTMDB,
    buscarTemporadaTMDB
};
