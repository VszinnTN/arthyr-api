require("colors");

class Database {
    constructor (mongoUri) {
        this.mongoUri = mongoUri;
    }

    async connect () {
        const { connect } = require("mongoose");

        try {
            connect(this.mongoUri)
            console.log("🧩 [MongoDB] Conexão com o banco de dados estabelecida com sucesso.".green);
        } catch (err) {
            console.log("❌ [MongoDB] Falha ao tentar estabelecer conexão com o Banco de Dados.".red);
        }
    }
}

module.exports = Database;
