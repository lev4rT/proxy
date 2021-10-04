const express = require('express');
const app = express();
const axios = require('axios');
const {db} = require('../Postgres/db');

app.use(express.json());


app.get ('/requests', async function getPlayerByID (req, res) {
    try {
        const answer = await db.query('SELECT * from requests');
        res.json(answer.rows);
    } catch (e) {
        res.json(e);
    }
});

app.get ('/requests/:id', async function getPlayerByID (req, res) {
    try {
        const id = req.params.id;
        const answer = await db.query('SELECT * from requests WHERE id=$1', [parseInt(id)]);
        res.json(answer.rows[0]);
    } catch (e) {
        res.json(e);
    }
});


app.get ('/repeat/:id', async function getPlayerByID (req, res) {
    try {
        const id = req.params.id;
        const answer = await db.query('SELECT * from requests WHERE id=$1', [parseInt(id)]);
        const request = answer.rows[0];
        let url = request.ssl ? 'https://' : 'http://' + `${request.host}${request.path}`;
        axios({
            url: url,
            method: request.method,
            headers: JSON.parse(request.headers),
            data: (request.method !== 'GET' && request.method !== 'HEAD') ? request.request_body.toString() : undefined,
        }).then((resp) => {
            res.json({status: resp.status, statusText: resp.statusText, data: resp.data});
            // console.log(resp);
        });
    } catch (e) {
        res.json(e);
    }
});

const port = 8081;
app.listen(port, () => {
    console.log(`CORS-enabled web server listening on port: ${port}`);
})