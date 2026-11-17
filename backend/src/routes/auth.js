
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const router = express.Router();

// Validar e-mail
const emailValido = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Dados públicos do usuário
const publico = (u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    foto: ""
});

// Criar token JWT
const criarToken = (u) =>
    jwt.sign(
        { email: u.email },
        process.env.JWT_SECRET,
        {
            subject: String(u.id),
            expiresIn: process.env.JWT_EXPIRES_IN || "7d"
        }
    );

// CADASTRO
router.post("/cadastro", async (req, res, next) => {
    try {
        const nome = String(req.body.nome || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const senha = String(req.body.senha || "");

        if (nome.length < 2 || nome.length > 100) {
            return res.status(400).json({
                erro: "Informe um nome entre 2 e 100 caracteres."
            });
        }

        if (!emailValido(email) || email.length > 150) {
            return res.status(400).json({
                erro: "Informe um e-mail válido."
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                erro: "A senha deve ter pelo menos 8 caracteres."
            });
        }

        // Criptografar senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Salvar usuário no MySQL
        const [resultado] = await db.execute(
            `INSERT INTO usuarios (nome, email, senha)
             VALUES (?, ?, ?)`,
            [nome, email, senhaHash]
        );

        const usuario = {
            id: resultado.insertId,
            nome,
            email
        };

        return res.status(201).json({
            usuario: publico(usuario),
            token: criarToken(usuario)
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
        }

        next(error);
    }
});

// LOGIN
router.post("/login", async (req, res, next) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const senha = String(req.body.senha || "");

        if (!emailValido(email)) {
            return res.status(400).json({
                erro: "Informe um e-mail válido."
            });
        }

        if (!senha) {
            return res.status(400).json({
                erro: "Informe sua senha."
            });
        }

        // Buscar usuário no MySQL
        const [usuarios] = await db.execute(
            `SELECT id, nome, email, senha
             FROM usuarios
             WHERE email = ?
             LIMIT 1`,
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const usuarioEncontrado = usuarios[0];

        // Comparar senha informada com o hash armazenado
        const senhaCorreta = await bcrypt.compare(
            senha,
            usuarioEncontrado.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const usuario = {
            id: usuarioEncontrado.id,
            nome: usuarioEncontrado.nome,
            email: usuarioEncontrado.email
        };

        return res.json({
            usuario: publico(usuario),
            token: criarToken(usuario)
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
