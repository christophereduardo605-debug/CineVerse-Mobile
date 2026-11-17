
require("dotenv").config();

const db = require("../config/database");

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function normalizar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

async function buscarNoTMDB(conteudo) {
    const tipo = conteudo.tipo === "Filme" ? "movie" : "tv";

    const parametros = new URLSearchParams({
        query: conteudo.titulo,
        language: "en-US",
        include_adult: "false"
    });

    const resposta = await fetch(
        `${BASE_URL}/search/${tipo}?${parametros}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
                accept: "application/json"
            }
        }
    );

    if (!resposta.ok) {
        throw new Error(`Erro TMDB: ${resposta.status}`);
    }

    const dados = await resposta.json();

    const resultado = dados.results.find((item) => {
        const tituloTMDB = tipo === "movie"
            ? item.original_title
            : item.original_name;

        const data = tipo === "movie"
            ? item.release_date
            : item.first_air_date;

        const anoTMDB = data ? Number(data.substring(0, 4)) : null;

        return (
            normalizar(tituloTMDB) === normalizar(conteudo.titulo) &&
            anoTMDB === Number(conteudo.ano)
        );
    });

    return resultado || null;
}

async function atualizarCatalogo() {
    try {
        if (!process.env.TMDB_ACCESS_TOKEN) {
            throw new Error("Token do TMDB não encontrado no .env");
        }

        const [conteudos] = await db.query(
            `SELECT id, titulo, ano, tipo
             FROM filmes_series
             ORDER BY id`
        );

        for (const conteudo of conteudos) {
            console.log(`\nConsultando: ${conteudo.titulo}`);

            const resultado = await buscarNoTMDB(conteudo);

            if (!resultado) {
                console.log("Título correspondente não encontrado.");
                continue;
            }

            const imagem = resultado.poster_path
                ? `${IMAGE_BASE_URL}${resultado.poster_path}`
                : null;

            await db.query(
                `UPDATE filmes_series
                 SET tmdb_id = ?, imagem = ?
                 WHERE id = ?`,
                [resultado.id, imagem, conteudo.id]
            );

            console.log("Atualizado com sucesso!");
            console.log("TMDB ID:", resultado.id);
            console.log("Capa:", imagem || "Sem pôster disponível");
        }

        console.log("\nAtualização do catálogo concluída!");

    } catch (error) {
        console.error("Erro na atualização:", error.message);
        process.exitCode = 1;

    } finally {
        await db.end();
    }
}

atualizarCatalogo();
