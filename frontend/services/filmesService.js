
import { api } from "./api";

// ======================================
// FILMES DO BANCO DE DADOS MYSQL
// ======================================

export const buscarFilmes = async () => {
    return await api("/filmes");
};

export const buscarFilmePorId = async (id) => {
    return await api(`/filmes/${encodeURIComponent(id)}`);
};

// ======================================
// CATÁLOGO GERAL DO TMDB
// ======================================

export const buscarCatalogoFilmesTMDB = async (pagina = 1) => {
    return await api(`/tmdb/filmes/catalogo?page=${pagina}`);
};

// ======================================
// FILMES ALEATÓRIOS
// ======================================

export const buscarFilmesAleatorios = async () => {
    return await api("/tmdb/filmes/aleatorios");
};

// ======================================
// LANÇAMENTOS RECENTES
// ======================================

export const buscarLancamentos = async () => {
    return await api("/tmdb/filmes/lancamentos");
};

// ======================================
// FILMES EM ALTA
// ======================================

export const buscarFilmesEmAlta = async () => {
    return await api("/tmdb/filmes/em-alta");
};

// ======================================
// FILMES POPULARES COM PAGINAÇÃO
// ======================================

export const buscarFilmesPopularesPaginados = async (pagina = 1) => {
    return await api(
        `/tmdb/filmes/populares/paginadas?page=${pagina}`
    );
};

// ======================================
// LANÇAMENTOS COM PAGINAÇÃO
// ======================================

export const buscarLancamentosPaginados = async (pagina = 1) => {
    return await api(
        `/tmdb/filmes/lancamentos/paginadas?page=${pagina}`
    );
};

// ======================================
// FILMES EM ALTA COM PAGINAÇÃO
// ======================================

export const buscarFilmesEmAltaPaginados = async (pagina = 1) => {
    return await api(
        `/tmdb/filmes/em-alta/paginadas?page=${pagina}`
    );
};

// ======================================
// DETALHES DO FILME
// ======================================

export const buscarDetalhesFilmeTMDB = async (id) => {
    return await api(`/tmdb/filmes/${encodeURIComponent(id)}`);
};

// ======================================
// TRAILER DO FILME
// ======================================

export const buscarTrailerFilmeTMDB = async (id) => {
    return await api(`/tmdb/filmes/${encodeURIComponent(id)}/trailer`);
};

// ======================================
// ONDE ASSISTIR AO FILME
// ======================================

export const buscarOndeAssistirFilmeTMDB = async (id) => {
    return await api(
        `/tmdb/filmes/${encodeURIComponent(id)}/onde-assistir`
    );
};

// ======================================
// SINCRONIZAR FILME DO TMDB COM MYSQL
// ======================================

export const sincronizarFilmeTMDB = async (tmdbId) => {
    return await api("/tmdb/conteudo", {
        method: "POST",
        body: JSON.stringify({
            tmdb_id: Number(tmdbId),
            tipo: "Filme",
        }),
    });
};

// ======================================
// CABEÇALHO DE AUTENTICAÇÃO
// ======================================

const obterCabecalhoAutenticacao = (token) => {
    if (!token) {
        throw new Error("Você precisa estar conectado para realizar esta ação.");
    }

    return {
        Authorization: `Bearer ${token}`,
    };
};

// ======================================
// BUSCAR CATÁLOGO PARA A TELA DE AVALIAÇÕES
// ======================================

export const buscarCatalogoAvaliacoes = async (
    tipo,
    pagina = 1
) => {
    if (!["Filme", "Série"].includes(tipo)) {
        throw new Error("O tipo deve ser Filme ou Série.");
    }

    const parametros = new URLSearchParams({
        tipo,
        pagina: String(pagina),
    });

    return await api(
        `/avaliacoes/catalogo?${parametros.toString()}`
    );
};

// ======================================
// BUSCAR RANKING DE AVALIAÇÕES
// PAGINAÇÃO POR FILME OU SÉRIE
// ======================================

export const buscarRankingAvaliacoes = async (
    tipo,
    pagina = 1,
    limite = 10
) => {
    if (!["Filme", "Série"].includes(tipo)) {
        throw new Error("O tipo deve ser Filme ou Série.");
    }

    const parametros = new URLSearchParams({
        tipo,
        pagina: String(pagina),
        limite: String(limite),
    });

    return await api(
        `/avaliacoes/ranking?${parametros.toString()}`
    );
};

// ======================================
// BUSCAR AVALIAÇÕES DE UM FILME
// ======================================

export const buscarAvaliacoesFilme = async (filmeSerieId) => {
    return await api(
        `/avaliacoes/${encodeURIComponent(filmeSerieId)}`
    );
};

// ======================================
// CADASTRAR AVALIAÇÃO
// ======================================

export const cadastrarAvaliacao = async (
    filmeSerieId,
    nota,
    comentario,
    token
) => {
    return await api("/avaliacoes", {
        method: "POST",
        headers: obterCabecalhoAutenticacao(token),
        body: JSON.stringify({
            filme_serie_id: Number(filmeSerieId),
            nota: Number(nota),
            comentario: comentario?.trim() || null,
        }),
    });
};

// ======================================
// EDITAR AVALIAÇÃO
// ======================================

export const editarAvaliacao = async (
    avaliacaoId,
    nota,
    comentario,
    token
) => {
    return await api(
        `/avaliacoes/${encodeURIComponent(avaliacaoId)}`,
        {
            method: "PUT",
            headers: obterCabecalhoAutenticacao(token),
            body: JSON.stringify({
                nota: Number(nota),
                comentario: comentario?.trim() || null,
            }),
        }
    );
};

// ======================================
// EXCLUIR AVALIAÇÃO
// ======================================

export const excluirAvaliacao = async (avaliacaoId, token) => {
    return await api(
        `/avaliacoes/${encodeURIComponent(avaliacaoId)}`,
        {
            method: "DELETE",
            headers: obterCabecalhoAutenticacao(token),
        }
    );
};

// ======================================
// BUSCAR RESPOSTAS DE UMA AVALIAÇÃO
// ======================================

export const buscarRespostasAvaliacao = async (avaliacaoId) => {
    return await api(
        `/avaliacoes/${encodeURIComponent(avaliacaoId)}/respostas`
    );
};

// ======================================
// ENVIAR RESPOSTA A UMA AVALIAÇÃO
// ======================================

export const cadastrarRespostaAvaliacao = async (
    avaliacaoId,
    comentario,
    token
) => {
    return await api(
        `/avaliacoes/${encodeURIComponent(avaliacaoId)}/respostas`,
        {
            method: "POST",
            headers: obterCabecalhoAutenticacao(token),
            body: JSON.stringify({
                comentario: comentario.trim(),
            }),
        }
    );
};
