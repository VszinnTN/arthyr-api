const express = require("express");
const router = express.Router();
const { request: requester } = require("undici");

const fs = require("fs");
const folders = fs.readdirSync('./source/app/routes/').filter(folder => folder.endsWith(".js") == false);

folders.forEach(folder => {
    const files = fs.readdirSync(`./source/app/routes/${folder}/`).filter(files => files.endsWith(".js"));
    
    router.get(`/${folder}`, async (request, response) => {
        response.send({
            availableRoutes: files.map(file => file.replace('.js', '')),
            status: 200
        }).status(200)
    })

    files.forEach(file => {
        file = require(`./${folder}/${file}`)
        if (!file?.route)
            return;

        if (!file?.execute)
            return;

        router.get(`/${folder}/${file.route}`, file.execute)
    })
})

router.get('/info', async (request, response) => {
    const session = request.cookies?.lastSession;
    const oauth = session?.oauthData

    if (session) {
        const expiredSession = session.id.split('/')[1] < Date.now();
        const user = await requester(`https://discord.com/api/users/@me`, {
            headers: {
                authorization: `${oauth.token_type} ${oauth.access_token}`
            }
        }).then(user => user.body.json())

        response.send({
            user: `${user.id}`,
            expiredSession
        })
    } else {
        response.send({
            content: "Nenhuma sessão encontrada",
            error: 404
        }).status(404)
    }
})

router.get('/', async (request, response) => {
    const session = request.cookies?.lastSession;
    const user = await requester

    if (session && session.id.split("/")[1] < Date.now())
        return response.send({
            message: "O seu acesso à API Expirou, renove-a em nosos servidor do Discord.",
            status: 404
        }).status(404)

    return response.send({
        availableRoutes: folders.map(folder => `${folder}`),
        status: 200
    }).status(200)
})

module.exports = router;
