
const express = require("express");
const db = require("../config/database");
const autenticar = require("../middleware/autenticacao");

const {
    buscarCatalogoFilmesTMDB,
    buscarCatalogoSeriesTMDB
} = require("../services/tmdb");

const router = express.Router();

// ======================================
// VALIDAR ID
// ======================================

function validarId(id) {
    const numero = Number(id);
    return Number.isInteger(numero) && numero > 0;
}

// ======================================
// RANKING DOS CONTEÚDOS MAIS AVALIADOS
// ======================================

router.get("/ranking", async (req, res) => {
    try {
        const tipo = req.query.tipo || null;

        if (tipo && !["Filme", "Série"].includes(tipo)) {
            return res.status(400).json({
                erro: "O tipo deve ser Filme ou Série."
            });
        }

        const paginaSolicitada = Number(req.query.pagina || 1);
        const limiteSolicitado = Number(req.query.limite || 10);

        const pagina = Number.isInteger(paginaSolicitada)
            ? Math.max(paginaSolicitada, 1)
            : 1;

        const limite = Number.isInteger(limiteSolicitado)
            ? Math.min(Math.max(limiteSolicitado, 1), 50)
            : 10;

        const offset = (pagina - 1) * limite;

        const [contagem] = await db.execute(
            `SELECT COUNT(DISTINCT fs.id) AS total
             FROM filmes_series fs
             INNER JOIN avaliacoes a
                ON a.filme_serie_id = fs.id
             WHERE (? IS NULL OR fs.tipo = ?)`,
            [tipo, tipo]
        );

        const [ranking] = await db.execute(
            `SELECT
                fs.id,
                fs.titulo,
                fs.tipo,
                fs.ano,
                fs.imagem,
                COUNT(a.id) AS total_avaliacoes,
                ROUND(AVG(a.nota), 1) AS media
             FROM filmes_series fs
             INNER JOIN avaliacoes a
                ON a.filme_serie_id = fs.id
             WHERE (? IS NULL OR fs.tipo = ?)
             GROUP BY
                fs.id,
                fs.titulo,
                fs.tipo,
                fs.ano,
                fs.imagem
             ORDER BY
                total_avaliacoes DESC,
                media DESC,
                fs.titulo ASC,
                fs.id ASC
             LIMIT ? OFFSET ?`,
            [tipo, tipo, limite, offset]
        );

        const total = Number(contagem[0].total);

        return res.json({
            tipo: tipo || "Todos",
            pagina,
            limite,
            total,
            temMais: offset + ranking.length < total,
            resultados: ranking.map((item) => ({
                ...item,
                total_avaliacoes: Number(item.total_avaliacoes),
                media: Number(item.media)
            }))
        });

    } catch (error) {
        console.error("Erro ao carregar ranking:", error.message);

        return res.status(500).json({
            erro: "Não foi possível carregar o ranking de avaliações."
        });
    }
});

// ======================================
// CATÁLOGO DE AVALIAÇÕES - TMDB + MYSQL
// ======================================

router.get("/catalogo", async (req, res) => {
    try {
        const tipo = req.query.tipo;
        const pagina = Number(req.query.pagina || 1);

        if (!["Filme", "Série"].includes(tipo)) {
            return res.status(400).json({
                erro: "O tipo deve ser Filme ou Série."
            });
        }

        if (
            !Number.isInteger(pagina) ||
            pagina < 1 ||
            pagina > 500
        ) {
            return res.status(400).json({
                erro: "Número de página inválido."
            });
        }

        // Buscar catálogo no TMDB
        const catalogo = tipo === "Filme"
            ? await buscarCatalogoFilmesTMDB(pagina)
            : await buscarCatalogoSeriesTMDB(pagina);

        const conteudosTMDB = catalogo.resultados || [];

        if (conteudosTMDB.length === 0) {
            return res.json({
                ...catalogo,
                tipo,
                resultados: []
            });
        }

        // Identificar os IDs do TMDB
        const idsTMDB = conteudosTMDB.map((item) =>
            Number(item.tmdb_id ?? item.id)
        );

        if (
            idsTMDB.some(
                (id) => !Number.isInteger(id) || id <= 0
            )
        ) {
            throw new Error("O catálogo retornou um ID inválido.");
        }

        const placeholders = idsTMDB.map(() => "?").join(",");

        // Buscar estatísticas existentes no MySQL
        const [estatisticas] = await db.execute(
            `SELECT
                fs.id,
                fs.tmdb_id,
                COUNT(a.id) AS total_avaliacoes,
                COALESCE(ROUND(AVG(a.nota), 1), 0) AS media
             FROM filmes_series fs
             LEFT JOIN avaliacoes a
                ON a.filme_serie_id = fs.id
             WHERE fs.tipo = ?
             AND fs.tmdb_id IN (${placeholders})
             GROUP BY fs.id, fs.tmdb_id`,
            [tipo, ...idsTMDB]
        );

        // Organizar estatísticas pelo ID do TMDB
        const mapaEstatisticas = new Map(
            estatisticas.map((item) => [
                Number(item.tmdb_id),
                item
            ])
        );

        // Combinar catálogo TMDB com estatísticas MySQL
        const resultados = conteudosTMDB.map((item) => {
            const tmdbId = Number(item.tmdb_id ?? item.id);
            const estatistica = mapaEstatisticas.get(tmdbId);

            return {
                ...item,
                id: estatistica ? Number(estatistica.id) : null,
                tmdb_id: tmdbId,
                tipo,
                total_avaliacoes: estatistica
                    ? Number(estatistica.total_avaliacoes)
                    : 0,
                media: estatistica
                    ? Number(estatistica.media)
                    : 0
            };
        });

        return res.json({
            ...catalogo,
            tipo,
            resultados
        });

    } catch (error) {
        console.error(
            "Erro ao carregar catálogo de avaliações:",
            error.message
        );

        return res.status(500).json({
            erro: "Não foi possível carregar o catálogo de avaliações."
        });
    }
});

// ======================================
// LISTAR AVALIAÇÕES DE UM FILME OU SÉRIE
// ======================================

router.get("/:filmeSerieId", async (req, res) => {
    try {
        const filmeSerieId = Number(req.params.filmeSerieId);

        if (!validarId(filmeSerieId)) {
            return res.status(400).json({
                erro: "ID do conteúdo inválido."
            });
        }

        const [conteudos] = await db.execute(
            `SELECT id, titulo, tipo
             FROM filmes_series
             WHERE id = ?`,
            [filmeSerieId]
        );

        if (conteudos.length === 0) {
            return res.status(404).json({
                erro: "Filme ou série não encontrado."
            });
        }

        const [estatisticas] = await db.execute(
            `SELECT
                COUNT(*) AS total_avaliacoes,
                COALESCE(AVG(nota), 0) AS media
             FROM avaliacoes
             WHERE filme_serie_id = ?`,
            [filmeSerieId]
        );

        const [avaliacoes] = await db.execute(
            `SELECT
                a.id,
                a.usuario_id,
                u.nome AS usuario,
                a.nota,
                a.comentario,
                a.data_avaliacao
             FROM avaliacoes a
             INNER JOIN usuarios u
                ON u.id = a.usuario_id
             WHERE a.filme_serie_id = ?
             ORDER BY a.data_avaliacao DESC`,
            [filmeSerieId]
        );

        return res.json({
            conteudo: conteudos[0],
            estatisticas: {
                total_avaliacoes: estatisticas[0].total_avaliacoes,
                media: Number(Number(estatisticas[0].media).toFixed(1))
            },
            avaliacoes
        });

    } catch (error) {
        console.error("Erro ao listar avaliações:", error.message);

        return res.status(500).json({
            erro: "Não foi possível carregar as avaliações."
        });
    }
});

// ======================================
// PUBLICAR AVALIAÇÃO
// ======================================

router.post("/", autenticar, async (req, res) => {
    try {
        const usuarioId = Number(req.usuarioId);
        const filmeSerieId = Number(req.body?.filme_serie_id);
        const nota = Number(req.body?.nota);
        const comentario = req.body?.comentario;

        if (!validarId(usuarioId)) {
            return res.status(401).json({
                erro: "Usuário não autenticado."
            });
        }

        if (!validarId(filmeSerieId)) {
            return res.status(400).json({
                erro: "ID do filme ou série inválido."
            });
        }

        if (
            !Number.isFinite(nota) ||
            nota < 1 ||
            nota > 5 ||
            !Number.isInteger(nota * 2)
        ) {
            return res.status(400).json({
                erro: "A nota deve ser de 1 a 5 estrelas, em intervalos de 0,5."
            });
        }

        if (
            comentario !== undefined &&
            comentario !== null &&
            typeof comentario !== "string"
        ) {
            return res.status(400).json({
                erro: "O comentário precisa ser um texto."
            });
        }

        const texto = comentario?.trim() || null;

        const [conteudos] = await db.execute(
            "SELECT id FROM filmes_series WHERE id = ?",
            [filmeSerieId]
        );

        if (conteudos.length === 0) {
            return res.status(404).json({
                erro: "Filme ou série não encontrado."
            });
        }

        const [resultado] = await db.execute(
            `INSERT INTO avaliacoes
                (usuario_id, filme_serie_id, nota, comentario)
             VALUES (?, ?, ?, ?)`,
            [usuarioId, filmeSerieId, nota, texto]
        );

        return res.status(201).json({
            mensagem: "Avaliação publicada com sucesso.",
            avaliacao: {
                id: resultado.insertId,
                usuario_id: usuarioId,
                filme_serie_id: filmeSerieId,
                nota,
                comentario: texto
            }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Você já avaliou este conteúdo. Edite sua avaliação existente."
            });
        }

        console.error("Erro ao publicar avaliação:", error.message);

        return res.status(500).json({
            erro: "Não foi possível publicar a avaliação."
        });
    }
});

// ======================================
// EDITAR A PRÓPRIA AVALIAÇÃO
// ======================================

router.put("/:id", autenticar, async (req, res) => {
    try {
        const avaliacaoId = Number(req.params.id);
        const usuarioId = Number(req.usuarioId);
        const nota = Number(req.body?.nota);
        const comentario = req.body?.comentario;

        if (!validarId(avaliacaoId) || !validarId(usuarioId)) {
            return res.status(400).json({
                erro: "ID inválido."
            });
        }

        if (
            !Number.isFinite(nota) ||
            nota < 1 ||
            nota > 5 ||
            !Number.isInteger(nota * 2)
        ) {
            return res.status(400).json({
                erro: "A nota deve ser de 1 a 5 estrelas, em intervalos de 0,5."
            });
        }

        if (
            comentario !== undefined &&
            comentario !== null &&
            typeof comentario !== "string"
        ) {
            return res.status(400).json({
                erro: "O comentário precisa ser um texto."
            });
        }

        const texto = comentario?.trim() || null;

        const [resultado] = await db.execute(
            `UPDATE avaliacoes
             SET nota = ?, comentario = ?
             WHERE id = ? AND usuario_id = ?`,
            [nota, texto, avaliacaoId, usuarioId]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Avaliação não encontrada ou você não tem permissão para editá-la."
            });
        }

        return res.json({
            mensagem: "Avaliação atualizada com sucesso."
        });

    } catch (error) {
        console.error("Erro ao editar avaliação:", error.message);

        return res.status(500).json({
            erro: "Não foi possível editar a avaliação."
        });
    }
});

// ======================================
// EXCLUIR A PRÓPRIA AVALIAÇÃO
// ======================================

router.delete("/:id", autenticar, async (req, res) => {
    try {
        const avaliacaoId = Number(req.params.id);
        const usuarioId = Number(req.usuarioId);

        if (!validarId(avaliacaoId) || !validarId(usuarioId)) {
            return res.status(400).json({
                erro: "ID inválido."
            });
        }

        const [resultado] = await db.execute(
            `DELETE FROM avaliacoes
             WHERE id = ? AND usuario_id = ?`,
            [avaliacaoId, usuarioId]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Avaliação não encontrada ou você não tem permissão para excluí-la."
            });
        }

        return res.json({
            mensagem: "Avaliação excluída com sucesso."
        });

    } catch (error) {
        console.error("Erro ao excluir avaliação:", error.message);

        return res.status(500).json({
            erro: "Não foi possível excluir a avaliação."
        });
    }
});

// ======================================
// LISTAR RESPOSTAS DE UMA AVALIAÇÃO
// ======================================

router.get("/:id/respostas", async (req, res) => {
    try {
        const avaliacaoId = Number(req.params.id);

        if (!validarId(avaliacaoId)) {
            return res.status(400).json({
                erro: "ID da avaliação inválido."
            });
        }

        const [respostas] = await db.execute(
            `SELECT
                r.id,
                r.avaliacao_id,
                r.usuario_id,
                u.nome AS usuario,
                r.comentario,
                r.data_resposta
             FROM respostas_avaliacoes r
             INNER JOIN usuarios u
                ON u.id = r.usuario_id
             WHERE r.avaliacao_id = ?
             ORDER BY r.data_resposta ASC`,
            [avaliacaoId]
        );

        return res.json(respostas);

    } catch (error) {
        console.error("Erro ao listar respostas:", error.message);

        return res.status(500).json({
            erro: "Não foi possível carregar as respostas."
        });
    }
});

// ======================================
// RESPONDER A UMA AVALIAÇÃO
// ======================================

router.post("/:id/respostas", autenticar, async (req, res) => {
    try {
        const avaliacaoId = Number(req.params.id);
        const usuarioId = Number(req.usuarioId);
        const comentario = req.body?.comentario;

        if (!validarId(avaliacaoId) || !validarId(usuarioId)) {
            return res.status(400).json({
                erro: "ID inválido."
            });
        }

        if (
            typeof comentario !== "string" ||
            !comentario.trim()
        ) {
            return res.status(400).json({
                erro: "Digite uma resposta antes de publicar."
            });
        }

        const [avaliacoes] = await db.execute(
            "SELECT id FROM avaliacoes WHERE id = ?",
            [avaliacaoId]
        );

        if (avaliacoes.length === 0) {
            return res.status(404).json({
                erro: "Avaliação não encontrada."
            });
        }

        const texto = comentario.trim();

        const [resultado] = await db.execute(
            `INSERT INTO respostas_avaliacoes
                (avaliacao_id, usuario_id, comentario)
             VALUES (?, ?, ?)`,
            [avaliacaoId, usuarioId, texto]
        );

        return res.status(201).json({
            mensagem: "Resposta publicada com sucesso.",
            resposta: {
                id: resultado.insertId,
                avaliacao_id: avaliacaoId,
                usuario_id: usuarioId,
                comentario: texto
            }
        });

    } catch (error) {
        console.error("Erro ao publicar resposta:", error.message);

        return res.status(500).json({
            erro: "Não foi possível publicar a resposta."
        });
    }
});

module.exports = router;
