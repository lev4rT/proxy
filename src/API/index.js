const express = require('express');
const app = express();
const axios = require('axios');
const {db} = require('../Postgres/db');

app.use(express.json());


app.get ('/requests', async (req, res) => {
    try {
        const answer = await db.query('SELECT * from requests');
        res.json(answer.rows);
    } catch (e) {
        res.json(e);
    }
});

app.get ('/requests/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const answer = await db.query('SELECT * from requests WHERE id=$1', [parseInt(id)]);
        res.json(answer.rows[0]);
    } catch (e) {
        res.json(e);
    }
});


app.get ('/repeat/:id', async (req, res) => {
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

// XSS VULNERABLE
app.get ('/scand/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const answer = await db.query('SELECT * from requests WHERE id=$1', [parseInt(id)]);
        const request = answer.rows[0];
        let url = request.ssl ? 'https://' : 'http://' + `${request.host}${request.path}`;

        const XSS = `vulnerable'"><img src onerror=alert()>`;
        const vulnerable = [];
        let params = request.request_body.split('&');
        for (let pos = 0; pos < params.length; ++pos) {

            params[pos] = params[pos].split('=');
            params[pos][1] = XSS;
            params[pos] = params[pos].join('=');
            let xssParams = params.join('&');
            axios({
                url: url,
                method: request.method,
                headers: JSON.parse(request.headers),
                data: xssParams,
            }).then((resp) => {
                if (resp.data.includes(XSS)) {
                    vulnerable.push(params[pos]);
                }
            });
        }
        res.json({vulnerable_params: vulnerable});
    } catch (e) {
            res.json(e);
        }
});

const port = 8081;
app.listen(port, () => {
    console.log(`API web server listening on port: ${port}`);
})