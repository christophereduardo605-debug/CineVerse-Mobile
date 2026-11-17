const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ======================================
// IMPORTAR ROTAS
// ======================================

const catalogo = require("./routes/catalogo");
const auth = require("./routes/auth");
const conta = require("./routes/conta");
const avaliacoes = require("./routes/avaliacoes");

// ======================================
// IMPORTAR CONEXÃO COM BANCO DE DADOS
// ======================================

const db = require("./config/database");

// ======================================
// INICIALIZAR APLICAÇÃO
// ======================================

const app = express();

// ======================================
// MIDDLEWARES
// ======================================

app.use(helmet());

app.use(cors());

app.use(express.json({
    limit: "100kb"
}));

// ======================================
// VERIFICAR SERVIDOR E BANCO DE DADOS
// ======================================

app.get("/health", async (_req, res) => {
    try {
        await db.query("SELECT 1");

        return res.status(200).json({
            status: "ok",
            projeto: "CineVerse API",
            bancoDeDados: true
        });

    } catch (error) {
        console.error(
            "Erro na verificação do banco:",
            error.message
        );

        return res.status(503).json({
            status: "erro",
            projeto: "CineVerse API",
            bancoDeDados: false
        });
    }
});

// ======================================
// ROTAS DE AUTENTICAÇÃO
// ======================================

app.use(
    "/auth",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 30,
        standardHeaders: true,
        legacyHeaders: false
    }),
    auth
);

// ======================================
// ROTAS DO CATÁLOGO
// ======================================

app.use("/", catalogo);

// ======================================
// ROTAS DO USUÁRIO
// ======================================

app.use("/usuarios/me", conta);

// ======================================
// ROTAS DE AVALIAÇÕES E DEBATES
// ======================================

app.use("/avaliacoes", avaliacoes);

// ======================================
// ROTA NÃO ENCONTRADA
// ======================================

app.use((_req, res) => {
    res.status(404).json({
        erro: "Rota não encontrada."
    });
});

// ======================================
// TRATAMENTO DE ERROS
// ======================================

app.use((err, _req, res, _next) => {
    console.error("Erro interno:", err);

    res.status(500).json({
        erro: "Erro interno do servidor."
    });
});

// ======================================
// EXPORTAR APLICAÇÃO
// ======================================

module.exports = app;
