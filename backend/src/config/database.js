const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const certificado = path.resolve(
    __dirname,
    "../../certificados/isrgrootx1.pem"
);

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: fs.readFileSync(certificado),
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10
});

db.getConnection()
    .then(connection => {
        console.log("TiDB Cloud conectado com sucesso!");
        connection.release();
    })
    .catch(error => {
        console.error("Erro ao conectar ao TiDB Cloud:", error.message);
    });

module.exports = db;
