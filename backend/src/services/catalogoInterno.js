
const db = require("../config/database");

async function localizarOuCadastrarConteudo(conteudo) {
    const tmdbId = Number(conteudo.tmdb_id);

    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
        throw new Error("ID do TMDB inválido.");
    }

    if (!["Filme", "Série"].includes(conteudo.tipo)) {
        throw new Error("Tipo de conteúdo inválido.");
    }

    if (
        typeof conteudo.titulo !== "string" ||
        !conteudo.titulo.trim()
    ) {
        throw new Error("Título do conteúdo não informado.");
    }

    const titulo = conteudo.titulo.trim();
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Insere somente se o conteúdo ainda não existir.
        const [resultado] = await connection.execute(
            `INSERT IGNORE INTO filmes_series
                (titulo, descricao, ano, tipo, imagem, tmdb_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                titulo,
                conteudo.descricao || null,
                conteudo.ano || null,
                conteudo.tipo,
                conteudo.imagem || null,
                tmdbId
            ]
        );

        const novo = resultado.affectedRows === 1;
        let conteudoId;

        if (novo) {
            conteudoId = resultado.insertId;

            // Cria uma notificação para cada usuário cadastrado.
            const tituloNotificacao =
                conteudo.tipo === "Filme"
                    ? "Novo filme no CineVerse"
                    : "Nova série no CineVerse";

            const mensagem =
                `"${titulo}" acabou de chegar ao catálogo.`;

            await connection.execute(
                `INSERT INTO notificacoes
                    (usuario_id, conteudo_id, titulo, mensagem, tipo)
                 SELECT
                    id, ?, ?, ?, ?
                 FROM usuarios`,
                [
                    conteudoId,
                    tituloNotificacao,
                    mensagem,
                    conteudo.tipo
                ]
            );
        } else {
            // Recupera o ID do conteúdo que já estava cadastrado.
            const [dados] = await connection.execute(
                `SELECT id
                 FROM filmes_series
                 WHERE tmdb_id = ? AND tipo = ?
                 LIMIT 1`,
                [tmdbId, conteudo.tipo]
            );

            if (dados.length === 0) {
                throw new Error(
                    "Não foi possível localizar o conteúdo cadastrado."
                );
            }

            conteudoId = dados[0].id;
        }

        await connection.commit();

        return {
            id: conteudoId,
            tmdb_id: tmdbId,
            titulo,
            tipo: conteudo.tipo,
            novo
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

module.exports = {
    localizarOuCadastrarConteudo
};
