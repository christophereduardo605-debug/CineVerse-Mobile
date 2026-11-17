
const express = require("express");
const db = require("../config/database");

const {
    localizarOuCadastrarConteudo
} = require("../services/catalogoInterno");

const {
    buscarCatalogoFilmesTMDB,
    buscarCatalogoSeriesTMDB,
    buscarFilmesTMDB,

    // FILMES PAGINADOS
    buscarFilmesPopularesPaginadosTMDB,
    buscarLancamentosPaginadosTMDB,
    buscarFilmesEmAltaPaginadosTMDB,

    // SÉRIES
    buscarSeriesTMDB,
    buscarSeriesPopularesTMDB,
    buscarSeriesEmAltaTMDB,
    buscarSeriesPopularesPaginadasTMDB,
    buscarSeriesEmAltaPaginadasTMDB,

    // FILMES
    buscarFilmesAleatoriosTMDB,
    buscarLancamentosTMDB,
    buscarFilmesEmAltaTMDB,

    // DETALHES, TRAILERS E PLATAFORMAS
    buscarDetalhesFilmeTMDB,
    buscarTrailerFilmeTMDB,
    buscarTrailerSerieTMDB,
    buscarTrailerTemporadaTMDB,
    buscarOndeAssistirFilmeTMDB,
    buscarDetalhesSerieTMDB,
    buscarTemporadaTMDB
} = require("../services/tmdb");

const router = express.Router();

// ======================================
// ADICIONAR PLATAFORMAS AOS CONTEÚDOS DO MYSQL
// ======================================

async function adicionarDisponibilidades(conteudos) {
    if (conteudos.length === 0) {
        return conteudos;
    }

    const ids = conteudos.map((conteudo) => conteudo.id);

    const [disponibilidades] = await db.query(
        `SELECT
            d.filme_serie_id,
            p.nome AS plataforma,
            d.play,
            d.link
         FROM disponibilidades d
         INNER JOIN plataformas p
            ON p.id = d.plataforma_id
         WHERE d.filme_serie_id IN (?)
         ORDER BY p.nome`,
        [ids]
    );

    return conteudos.map((conteudo) => ({
        ...conteudo,
        disponibilidades: disponibilidades
            .filter((item) => item.filme_serie_id === conteudo.id)
            .map((item) => ({
                plataforma: item.plataforma,
                play: item.play,
                link: item.link
            }))
    }));
}

// ======================================
// VALIDAR PÁGINA
// ======================================

function validarPagina(pagina) {
    return (
        Number.isInteger(pagina) &&
        pagina >= 1 &&
        pagina <= 500
    );
}

// ======================================
// ROTAS DE DESCOBERTA DA HOME - TMDB
// ======================================

// FILMES ALEATÓRIOS
router.get("/tmdb/filmes/aleatorios", async (req, res) => {
    try {
        const resultados = await buscarFilmesAleatoriosTMDB();
        res.json(resultados);
    } catch (error) {
        console.error("Erro ao buscar filmes aleatórios:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar os filmes aleatórios."
        });
    }
});

// LANÇAMENTOS RECENTES
router.get("/tmdb/filmes/lancamentos", async (req, res) => {
    try {
        const resultados = await buscarLancamentosTMDB();
        res.json(resultados);
    } catch (error) {
        console.error("Erro ao buscar lançamentos:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar os lançamentos."
        });
    }
});

// FILMES EM ALTA
router.get("/tmdb/filmes/em-alta", async (req, res) => {
    try {
        const resultados = await buscarFilmesEmAltaTMDB();
        res.json(resultados);
    } catch (error) {
        console.error("Erro ao buscar filmes em alta:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar os filmes em alta."
        });
    }
});

// ======================================
// FILMES POPULARES COM PAGINAÇÃO
// ======================================

router.get("/tmdb/filmes/populares/paginadas", async (req, res) => {
    try {
        const pagina = Number(req.query.page) || 1;

        if (!validarPagina(pagina)) {
            return res.status(400).json({
                erro: "Número de página inválido."
            });
        }

        const resultado =
            await buscarFilmesPopularesPaginadosTMDB(pagina);

        res.json(resultado);
    } catch (error) {
        console.error("Erro ao buscar filmes populares:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar os filmes populares."
        });
    }
});

// ======================================
// LANÇAMENTOS COM PAGINAÇÃO
// ======================================

router.get("/tmdb/filmes/lancamentos/paginadas", async (req, res) => {
    try {
        const pagina = Number(req.query.page) || 1;

        if (!validarPagina(pagina)) {
            return res.status(400).json({
                erro: "Número de página inválido."
            });
        }

        const resultado =
            await buscarLancamentosPaginadosTMDB(pagina);

        res.json(resultado);
    } catch (error) {
        console.error("Erro ao buscar lançamentos:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar os lançamentos."
        });
    }
});

// ======================================
// FILMES EM ALTA COM PAGINAÇÃO
// ======================================

router.get("/tmdb/filmes/em-alta/paginadas", async (req, res) => {
    try {
        const pagina = Number(req.query.page) || 1;

        if (!validarPagina(pagina)) {
            return res.status(400).json({
                erro: "Número de página inválido."
            });
        }

        const resultado =
            await buscarFilmesEmAltaPaginadosTMDB(pagina);

        res.json(resultado);
    } catch (error) {
        console.error("Erro ao buscar filmes em alta:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar os filmes em alta."
        });
    }
});

// ======================================
// SÉRIES POPULARES
// ======================================

router.get("/tmdb/series/populares", async (req, res) => {
    try {
        const resultados = await buscarSeriesPopularesTMDB();
        res.json(resultados);
    } catch (error) {
        console.error("Erro ao buscar séries populares:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar as séries populares."
        });
    }
});

// ======================================
// SÉRIES EM ALTA
// ======================================

router.get("/tmdb/series/em-alta", async (req, res) => {
    try {
        const resultados = await buscarSeriesEmAltaTMDB();
        res.json(resultados);
    } catch (error) {
        console.error("Erro ao buscar séries em alta:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar as séries em alta."
        });
    }
});

// ======================================
// SÉRIES POPULARES COM PAGINAÇÃO
// ======================================

router.get("/tmdb/series/populares/paginadas", async (req, res) => {
    try {
        const pagina = Number(req.query.page) || 1;

        if (!validarPagina(pagina)) {
            return res.status(400).json({
                erro: "Número de página inválido."
            });
        }

        const resultado =
            await buscarSeriesPopularesPaginadasTMDB(pagina);

        res.json(resultado);
    } catch (error) {
        console.error("Erro ao buscar séries populares:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar as séries populares."
        });
    }
});

// ======================================
// SÉRIES EM ALTA COM PAGINAÇÃO
// ======================================

router.get("/tmdb/series/em-alta/paginadas", async (req, res) => {
    try {
        const pagina = Number(req.query.page) || 1;

        if (!validarPagina(pagina)) {
            return res.status(400).json({
                erro: "Número de página inválido."
            });
        }

        const resultado =
            await buscarSeriesEmAltaPaginadasTMDB(pagina);

        res.json(resultado);
    } catch (error) {
        console.error("Erro ao buscar séries em alta:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar as séries em alta."
        });
    }
});

// ======================================
// PESQUISAS NO TMDB
// ======================================

// PESQUISAR FILMES
router.get("/tmdb/filmes", async (req, res) => {
    try {
        const busca = String(req.query.busca || "").trim();

        if (busca.length < 2) {
            return res.status(400).json({
                erro: "Digite pelo menos 2 caracteres para pesquisar."
            });
        }

        const resultados = await buscarFilmesTMDB(busca);
        res.json(resultados);
    } catch (error) {
        console.error("Erro ao pesquisar filmes no TMDB:", error.message);

        res.status(502).json({
            erro: "Não foi possível pesquisar filmes no TMDB."
        });
    }
});

// PESQUISAR SÉRIES COM PAGINAÇÃO
router.get("/tmdb/series/buscar", async (req, res) => {
    try {
        const busca = String(req.query.busca || "").trim();
        const pagina = Number(req.query.page) || 1;

        if (busca.length < 2) {
            return res.status(400).json({
                erro: "Digite pelo menos 2 caracteres para pesquisar."
            });
        }

        if (!validarPagina(pagina)) {
            return res.status(400).json({
                erro: "Número de página inválido."
            });
        }

        const resultado = await buscarSeriesTMDB(busca, pagina);
        res.json(resultado);
    } catch (error) {
        console.error("Erro ao pesquisar séries no TMDB:", error.message);

        res.status(502).json({
            erro: "Não foi possível pesquisar séries no TMDB."
        });
    }
});

// PESQUISA ANTIGA DE SÉRIES - COMPATIBILIDADE
router.get("/tmdb/series", async (req, res) => {
    try {
        const busca = String(req.query.busca || "").trim();

        if (busca.length < 2) {
            return res.status(400).json({
                erro: "Digite pelo menos 2 caracteres para pesquisar."
            });
        }

        const resultado = await buscarSeriesTMDB(busca);
        res.json(resultado.resultados);
    } catch (error) {
        console.error("Erro ao pesquisar séries no TMDB:", error.message);

        res.status(502).json({
            erro: "Não foi possível pesquisar séries no TMDB."
        });
    }
});

// ======================================
// CATÁLOGO GERAL DE SÉRIES - TMDB
// ======================================

router.get("/tmdb/series/catalogo", async (req, res) => {
    try {
        const pagina = Number(req.query.page) || 1;

        if (!validarPagina(pagina)) {
            return res.status(400).json({
                erro: "Número de página inválido."
            });
        }

        const resultado = await buscarCatalogoSeriesTMDB(pagina);

        return res.json(resultado);

    } catch (error) {
        console.error(
            "Erro ao carregar catálogo de séries do TMDB:",
            error.message
        );

        return res.status(502).json({
            erro: "Não foi possível carregar o catálogo de séries."
        });
    }
});

// ======================================
// TRAILER GERAL DA SÉRIE
// ======================================

router.get("/tmdb/series/:id/videos", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID da série inválido."
            });
        }

        const trailer = await buscarTrailerSerieTMDB(id);

        if (!trailer) {
            return res.status(404).json({
                erro: "Trailer não disponível para esta série."
            });
        }

        res.json(trailer);
    } catch (error) {
        console.error("Erro ao buscar trailer da série:", error.message);

        res.status(502).json({
            erro: "Não foi possível buscar o trailer da série."
        });
    }
});

// ======================================
// TRAILER DE UMA TEMPORADA
// ======================================

router.get(
    "/tmdb/series/:id/temporadas/:numero/videos",
    async (req, res) => {
        try {
            const id = Number(req.params.id);
            const numero = Number(req.params.numero);

            if (
                !Number.isInteger(id) ||
                id <= 0 ||
                !Number.isInteger(numero) ||
                numero < 0
            ) {
                return res.status(400).json({
                    erro: "ID da série ou número da temporada inválido."
                });
            }

            const trailer = await buscarTrailerTemporadaTMDB(
                id,
                numero
            );

            if (!trailer) {
                return res.status(404).json({
                    erro: "Trailer não disponível para esta temporada."
                });
            }

            res.json(trailer);
        } catch (error) {
            console.error(
                "Erro ao buscar trailer da temporada:",
                error.message
            );

            res.status(502).json({
                erro: "Não foi possível buscar o trailer desta temporada."
            });
        }
    }
);

// ======================================
// EPISÓDIOS DE UMA TEMPORADA
// ======================================

router.get("/tmdb/series/:id/temporadas/:numero", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const numero = Number(req.params.numero);

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
            !Number.isInteger(numero) ||
            numero < 0
        ) {
            return res.status(400).json({
                erro: "ID da série ou número da temporada inválido."
            });
        }

        const resultado = await buscarTemporadaTMDB(id, numero);
        res.json(resultado);
    } catch (error) {
        console.error("Erro ao buscar episódios da temporada:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar os episódios desta temporada."
        });
    }
});

// ======================================
// DETALHES DE UMA SÉRIE DO TMDB
// ======================================

router.get("/tmdb/series/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID da série inválido."
            });
        }

        const resultado = await buscarDetalhesSerieTMDB(id);
        res.json(resultado);
    } catch (error) {
        console.error("Erro ao buscar detalhes da série:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar os detalhes da série."
        });
    }
});

// ======================================
// CATÁLOGO GERAL DE FILMES - TMDB
// ======================================

router.get("/tmdb/filmes/catalogo", async (req, res) => {
    try {
        const pagina = Number(req.query.page) || 1;

        if (!validarPagina(pagina)) {
            return res.status(400).json({
                erro: "Número de página inválido."
            });
        }

        const resultados = await buscarCatalogoFilmesTMDB(pagina);
        res.json(resultados);
    } catch (error) {
        console.error(
            "Erro ao carregar catálogo de filmes do TMDB:",
            error.message
        );

        res.status(502).json({
            erro: "Não foi possível carregar o catálogo de filmes."
        });
    }
});

// ======================================
// TRAILER DO FILME - TMDB
// ======================================

router.get("/tmdb/filmes/:id/trailer", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID do TMDB inválido."
            });
        }

        const trailer = await buscarTrailerFilmeTMDB(id);

        if (!trailer) {
            return res.status(404).json({
                erro: "Trailer não disponível para este filme."
            });
        }

        res.json(trailer);
    } catch (error) {
        console.error("Erro ao buscar trailer:", error.message);

        res.status(502).json({
            erro: "Não foi possível buscar o trailer."
        });
    }
});

// ======================================
// ONDE ASSISTIR AO FILME - TMDB
// ======================================

router.get("/tmdb/filmes/:id/onde-assistir", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID do TMDB inválido."
            });
        }

        const resultado = await buscarOndeAssistirFilmeTMDB(id);
        res.json(resultado);
    } catch (error) {
        console.error(
            "Erro ao buscar plataformas do filme:",
            error.message
        );

        res.status(502).json({
            erro: "Não foi possível consultar onde assistir ao filme."
        });
    }
});

// ======================================
// DETALHES DE UM FILME DO TMDB
// ======================================

router.get("/tmdb/filmes/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID do TMDB inválido."
            });
        }

        const resultado = await buscarDetalhesFilmeTMDB(id);
        res.json(resultado);
    } catch (error) {
        console.error("Erro ao buscar detalhes no TMDB:", error.message);

        res.status(502).json({
            erro: "Não foi possível carregar os detalhes do filme."
        });
    }
});

// ======================================
// ROTAS DO CATÁLOGO MYSQL
// ======================================

// LISTAR FILMES DO MYSQL
router.get("/filmes", async (req, res) => {
    try {
        const busca = String(req.query.busca || "").trim();

        const [dados] = await db.query(
            `SELECT id, titulo, descricao, ano, tipo, imagem
             FROM filmes_series
             WHERE tipo = 'Filme'
             AND titulo LIKE ?
             ORDER BY titulo`,
            [`%${busca}%`]
        );

        const resultado = await adicionarDisponibilidades(dados);
        res.json(resultado);
    } catch (error) {
        console.error("Erro ao buscar filmes:", error.message);

        res.status(500).json({
            erro: "Erro ao buscar filmes."
        });
    }
});

// LISTAR SÉRIES DO MYSQL
router.get("/series", async (req, res) => {
    try {
        const busca = String(req.query.busca || "").trim();

        const [dados] = await db.query(
            `SELECT id, titulo, descricao, ano, tipo, imagem
             FROM filmes_series
             WHERE tipo = 'Série'
             AND titulo LIKE ?
             ORDER BY titulo`,
            [`%${busca}%`]
        );

        const resultado = await adicionarDisponibilidades(dados);
        res.json(resultado);
    } catch (error) {
        console.error("Erro ao buscar séries:", error.message);

        res.status(500).json({
            erro: "Erro ao buscar séries."
        });
    }
});

// DETALHES DE UM FILME DO MYSQL
router.get("/filmes/:id", async (req, res) => {
    try {
        const [dados] = await db.query(
            `SELECT id, titulo, descricao, ano, tipo, imagem
             FROM filmes_series
             WHERE id = ? AND tipo = 'Filme'`,
            [req.params.id]
        );

        if (dados.length === 0) {
            return res.status(404).json({
                erro: "Filme não encontrado."
            });
        }

        const resultado = await adicionarDisponibilidades(dados);
        res.json(resultado[0]);
    } catch (error) {
        console.error("Erro ao buscar filme:", error.message);

        res.status(500).json({
            erro: "Erro ao buscar filme."
        });
    }
});

// DETALHES DE UMA SÉRIE DO MYSQL
router.get("/series/:id", async (req, res) => {
    try {
        const [dados] = await db.query(
            `SELECT id, titulo, descricao, ano, tipo, imagem
             FROM filmes_series
             WHERE id = ? AND tipo = 'Série'`,
            [req.params.id]
        );

        if (dados.length === 0) {
            return res.status(404).json({
                erro: "Série não encontrada."
            });
        }

        const resultado = await adicionarDisponibilidades(dados);
        res.json(resultado[0]);
    } catch (error) {
        console.error("Erro ao buscar série:", error.message);

        res.status(500).json({
            erro: "Erro ao buscar série."
        });
    }
});

// ======================================
// INTEGRAÇÃO TMDB COM MYSQL E NOTIFICAÇÕES
// ======================================

router.post("/tmdb/conteudo", async (req, res) => {
    try {
        const tmdbId = Number(req.body?.tmdb_id);
        const tipo = req.body?.tipo;

        if (
            !Number.isInteger(tmdbId) ||
            tmdbId <= 0 ||
            !["Filme", "Série"].includes(tipo)
        ) {
            return res.status(400).json({
                erro: "Informe um ID válido do TMDB e o tipo Filme ou Série."
            });
        }

        let conteudo;

        if (tipo === "Filme") {
            conteudo = await buscarDetalhesFilmeTMDB(tmdbId);
        } else {
            conteudo = await buscarDetalhesSerieTMDB(tmdbId);
        }

        if (!conteudo) {
            return res.status(404).json({
                erro: "Conteúdo não encontrado no TMDB."
            });
        }

        const resultado = await localizarOuCadastrarConteudo({
            ...conteudo,
            tmdb_id: tmdbId,
            tipo
        });

        return res.status(200).json({
            mensagem: resultado.novo
                ? "Conteúdo cadastrado e notificações criadas com sucesso."
                : "Conteúdo já estava cadastrado.",
            novo: resultado.novo,
            conteudo: resultado
        });

    } catch (error) {
        console.error(
            "Erro ao integrar conteúdo do TMDB com MySQL:",
            error.message
        );

        return res.status(500).json({
            erro: "Não foi possível integrar o conteúdo ao catálogo."
        });
    }
});

// ======================================
// TESTAR CONEXÃO E CONSULTA AO MYSQL
// ======================================

router.get("/teste-banco", async (req, res) => {
    try {
        const [dados] = await db.query(
            "SELECT id, titulo, ano, tipo FROM filmes_series"
        );

        res.json(dados);
    } catch (error) {
        console.error("Erro ao consultar banco:", error.message);

        res.status(500).json({
            erro: "Não foi possível consultar o banco de dados."
        });
    }
});

module.exports = router;
