
const express = require("express");
const autenticar = require("../middleware/autenticacao");
const db = require("../config/database");

const {
    usuarios,
    favoritos,
    configuracoes
} = require("../store");

const router = express.Router();

router.use(autenticar);

// ======================================
// DADOS PÚBLICOS DO USUÁRIO
// ======================================

const publico = (u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    foto: u.foto || ""
});

// ======================================
// VALIDAR E-MAIL
// ======================================

const emailValido = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ======================================
// CONSULTAR PERFIL
// ======================================

router.get("/perfil", (req, res) => {
    const u = usuarios.get(req.usuarioId);

    if (!u) {
        return res.status(404).json({
            erro: "Usuário não encontrado nesta execução do servidor."
        });
    }

    res.json(publico(u));
});

// ======================================
// ATUALIZAR PERFIL
// ======================================

router.patch("/perfil", (req, res) => {
    const u = usuarios.get(req.usuarioId);

    if (!u) {
        return res.status(404).json({
            erro: "Usuário não encontrado."
        });
    }

    const nome = req.body.nome === undefined
        ? u.nome
        : String(req.body.nome).trim();

    const email = req.body.email === undefined
        ? u.email
        : String(req.body.email).trim().toLowerCase();

    const foto = req.body.foto === undefined
        ? u.foto
        : String(req.body.foto).trim();

    if (nome.length < 2) {
        return res.status(400).json({
            erro: "Nome inválido."
        });
    }

    if (!emailValido(email)) {
        return res.status(400).json({
            erro: "E-mail inválido."
        });
    }

    if ([...usuarios.values()].some(
        x => x.id !== u.id && x.email === email
    )) {
        return res.status(409).json({
            erro: "Este e-mail já está em uso."
        });
    }

    Object.assign(u, { nome, email, foto });

    res.json(publico(u));
});

// ======================================
// LISTAR FAVORITOS
// ======================================

router.get("/favoritos", (req, res) => {
    res.json(favoritos.get(req.usuarioId) || []);
});

// ======================================
// ADICIONAR FAVORITO
// ======================================

router.post("/favoritos", (req, res) => {
    const { conteudoId, tipo } = req.body;

    if (!conteudoId || !["filme", "serie"].includes(tipo)) {
        return res.status(400).json({
            erro: "Informe conteudoId e tipo (filme ou serie)."
        });
    }

    const lista = favoritos.get(req.usuarioId) || [];

    if (!lista.some(
        x => x.conteudoId === conteudoId && x.tipo === tipo
    )) {
        lista.push({
            conteudoId,
            tipo,
            adicionadoEm: new Date().toISOString()
        });
    }

    favoritos.set(req.usuarioId, lista);

    res.status(201).json(lista);
});

// ======================================
// REMOVER FAVORITO
// ======================================

router.delete("/favoritos/:tipo/:conteudoId", (req, res) => {
    if (!["filme", "serie"].includes(req.params.tipo)) {
        return res.status(400).json({
            erro: "Tipo inválido."
        });
    }

    const lista = (favoritos.get(req.usuarioId) || []).filter(
        x => !(
            x.tipo === req.params.tipo &&
            x.conteudoId === req.params.conteudoId
        )
    );

    favoritos.set(req.usuarioId, lista);

    res.json(lista);
});

// ======================================
// CONSULTAR CONFIGURAÇÕES
// ======================================

router.get("/configuracoes", (req, res) => {
    res.json(configuracoes.get(req.usuarioId) || {});
});

// ======================================
// ATUALIZAR CONFIGURAÇÕES
// ======================================

router.patch("/configuracoes", (req, res) => {
    const permitidas = [
        "notificacoes",
        "reproducaoAutomatica",
        "legendas",
        "perfilPrivado",
        "qualidade"
    ];

    const atual = {
        ...(configuracoes.get(req.usuarioId) || {})
    };

    for (const k of permitidas) {
        if (req.body[k] !== undefined) {
            atual[k] = req.body[k];
        }
    }

    if (
        ![
            "Automática",
            "Alta (1080p)",
            "Média (720p)",
            "Baixa (480p)"
        ].includes(atual.qualidade)
    ) {
        return res.status(400).json({
            erro: "Qualidade de reprodução inválida."
        });
    }

    configuracoes.set(req.usuarioId, atual);

    res.json(atual);
});

// ======================================
// NOTIFICAÇÕES DO USUÁRIO
// ======================================

// LISTAR NOTIFICAÇÕES
router.get("/notificacoes", async (req, res) => {
    try {
        const [notificacoes] = await db.execute(
            `SELECT
                n.id,
                n.usuario_id,
                n.conteudo_id,
                n.titulo,
                n.mensagem,
                n.tipo,
                n.lida,
                n.criada_em,
                f.imagem
             FROM notificacoes n
             LEFT JOIN filmes_series f
                ON f.id = n.conteudo_id
             WHERE n.usuario_id = ?
             ORDER BY n.criada_em DESC, n.id DESC
             LIMIT 100`,
            [req.usuarioId]
        );

        return res.json(notificacoes);

    } catch (error) {
        console.error(
            "Erro ao listar notificações:",
            error.message
        );

        return res.status(500).json({
            erro: "Não foi possível carregar as notificações."
        });
    }
});

// ======================================
// CONSULTAR QUANTIDADE DE NÃO LIDAS
// ======================================

router.get("/notificacoes/nao-lidas", async (req, res) => {
    try {
        const [resultado] = await db.execute(
            `SELECT COUNT(*) AS quantidade
             FROM notificacoes
             WHERE usuario_id = ?
             AND lida = FALSE`,
            [req.usuarioId]
        );

        return res.json({
            quantidade: Number(resultado[0].quantidade)
        });

    } catch (error) {
        console.error(
            "Erro ao consultar notificações não lidas:",
            error.message
        );

        return res.status(500).json({
            erro: "Não foi possível consultar as notificações não lidas."
        });
    }
});

// ======================================
// MARCAR NOTIFICAÇÃO COMO LIDA
// ======================================

router.patch("/notificacoes/:id/lida", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID da notificação inválido."
            });
        }

        const [resultado] = await db.execute(
            `UPDATE notificacoes
             SET lida = TRUE
             WHERE id = ?
             AND usuario_id = ?`,
            [id, req.usuarioId]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Notificação não encontrada."
            });
        }

        return res.json({
            mensagem: "Notificação marcada como lida."
        });

    } catch (error) {
        console.error(
            "Erro ao marcar notificação como lida:",
            error.message
        );

        return res.status(500).json({
            erro: "Não foi possível atualizar a notificação."
        });
    }
});

// ======================================
// NOTIFICAÇÕES PUSH
// ======================================

// REGISTRAR DISPOSITIVO
router.post("/notificacoes/dispositivo", async (req, res) => {
    try {
        const token = req.body?.expo_push_token;

        if (
            typeof token !== "string" ||
            !/^Expo(nent)?PushToken\[[^\]]+\]$/.test(token)
        ) {
            return res.status(400).json({
                erro: "Token de notificação inválido."
            });
        }

        await db.execute(
            `INSERT INTO dispositivos_notificacao
                (usuario_id, expo_push_token, ativo)
             VALUES (?, ?, TRUE)
             ON DUPLICATE KEY UPDATE
                usuario_id = VALUES(usuario_id),
                ativo = TRUE`,
            [req.usuarioId, token]
        );

        return res.json({
            mensagem: "Dispositivo registrado com sucesso."
        });

    } catch (error) {
        console.error(
            "Erro ao registrar dispositivo:",
            error.message
        );

        return res.status(500).json({
            erro: "Não foi possível registrar o dispositivo."
        });
    }
});

// ======================================
// ATIVAR OU DESATIVAR NOTIFICAÇÕES PUSH
// ======================================

router.patch("/notificacoes", async (req, res) => {
    try {
        const { ativo } = req.body;

        if (typeof ativo !== "boolean") {
            return res.status(400).json({
                erro: "Informe ativo como true ou false."
            });
        }

        await db.execute(
            `UPDATE dispositivos_notificacao
             SET ativo = ?
             WHERE usuario_id = ?`,
            [ativo, req.usuarioId]
        );

        return res.json({
            mensagem: ativo
                ? "Notificações ativadas."
                : "Notificações desativadas.",
            ativo
        });

    } catch (error) {
        console.error(
            "Erro ao atualizar notificações:",
            error.message
        );

        return res.status(500).json({
            erro: "Não foi possível atualizar as notificações."
        });
    }
});

module.exports = router;
