const express = require("express");
const app = express();
const routes = require("./routes");
require('dotenv').config();

const { request: requester } = require("undici");
const cookieParser = require("cookie-parser");
const Oauth2URL = `https://discord.com/oauth2/authorize?client_id=1395036263685427521&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A${process.env.PORT}%2F&scope=identify`

// Middlewares;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rotas /api;
app.use('/api', routes);

// Início
app.get("/", async (request, response) => {
    const { code } = request.query;
    const requesterIp = request.headers['x-forwarded-for'] || request.ip;

    if (code) {
        try {
            const tokenResponseData = await requester(`https://discord.com/api/oauth2/token`, {
                method: "POST",
                body: new URLSearchParams({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: `http://localhost:${process.env.PORT}/`,
                    scope: 'identify'
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const oauthData = await tokenResponseData.body.json();
            const session = {
                oauthData,
                id: `${requesterIp}`
            }

            response.cookie('lastSession', session, { maxAge: 3600000, httpOnly: true })
            response.redirect('/')
            
            let userData = await AppDatabase.sessions.findById(oauthData.id)
            if (!userData)
                userDat = await AppDatabase.sessions.create({ _id: oauthData.id });

            await AppDatabase.sessions.updateOne({
                _id: oauthData.id
            }, { 
                $push: { "sessions": 
                    {
                        id: session.id.split('/')[0].slice(0, 4) + '/' + Date.now(),
                        oauthData
                    }
                }
            })
        } catch (err) {
            console.error(err)
        }
    } else if (request.cookies?.lastSession || request.cookies?.lastSession.id.split('/')[1] > Date.now()) {
        const user = await requester(`https://discord.com/api/users/@me`, {
            headers: {
                authorization: `${request.cookies.lastSession.oauthData.token_type} ${request.cookies.lastSession.oauthData.access_token}`
            }
        })

        const json = await user.body.json();

        if (json?.message !== '401: Unauthorized' || json?.code !== 0) {
            if (json?.locale == "pt-BR") {
                response.send({
                    content: `Seja bem-vindo (ou vinda), novamente! @${json?.global_name || json.usnermae} (${json.id})`,
                    api_info: {
                        developedBy: "Arthur (@arthsz. | no discord)",
                        developedAt: "19/07/2025, 20:00",
                        with: "JavaScript, Node.js & Express."
                    }
                })
            } else {
                response.send({
                    content: `Welcome back! @${json?.global_name || json.usnermae} (${json.id})`,
                    api_info: {
                        developedBy: "Arthur (@arthsz. | no discord)",
                        developedAt: "19/07/2025, 20:00",
                        with: "JavaScript, Node.js & Express."
                    }
                })
            }
        } else response.redirect(Oauth2URL)
    } else {
        response.redirect(Oauth2URL)
    }
})

// Tratando os Erros...
app.use((req, res, next) => {
    const error = new Error('Rota não encontrada');
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || 'Erro interno do servidor';

    console.error(`Erro ${statusCode}: ${message}`);
    if (statusCode === 500) {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        output: {
            message: message,
            error: true
        },
        status: statusCode
    });
});

// Banco de Dados;
const Database = require("./database/setup");
const AppDatabase = new Database(process.env.MONGO_URL);

AppDatabase.connect()

console.log(Oauth2URL)
module.exports = app;
