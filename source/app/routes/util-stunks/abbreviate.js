module.exports = {
    route: "abbreviate",
    execute: async (request, response) => {
        const session = request.cookies?.session;   
        
        const { value } = request.query;
        const { abbreviate } = require("util-stunks");

        if (!value)
            return response.send({
                content: "Está faltando o query \"value (valor)\"",
                status: 404
            }).status(404)

        if (isNaN(value))
            return response.send({
                content: "O valor à ser abreviado não é válido",
                status: 404
            }).status(404)

        try {
            let output = abbreviate(value)
            const { separator } = request.query;

            if (separator)
                output = output.toLocaleString();

            response.send({
                content: { output },
                status: 200
            }).status(200)
        } catch (err) {
            console.error(err)

            response.send({
                error: "Internal Error",
                status: 500
            }).status(500)
        }
    }
}
