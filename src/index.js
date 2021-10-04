const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const fs = require('fs');
const http = require('http');
const tls = require('tls');
const spawn = require('child_process').spawn;
const binding = process.binding('http_parser');
const HTTPParser = binding.HTTPParser;
const methods = binding.methods;
const url = require('url');
const net = require('net');
tls.DEFAULT_MAX_VERSION = 'TLSv1.3';

const {preamble, maxBodySize, certs, port} = require('./utils/utils');
let requestCounter = 1;

const kOnHeadersComplete = HTTPParser.kOnHeadersComplete | 0;
const kOnBody = HTTPParser.kOnBody | 0;
const kOnMessageComplete = HTTPParser.kOnMessageComplete | 0;


let key;
let cert;

const {HTTPServerAsyncResource} = require('./ServerAsync');

function createSecureContext(key, cert) {
    return tls.createSecureContext({ key, cert });
}

function generateCertificate(servername, cb) {
    fs.writeFile(`./cfgs/${servername}.ext`, [...preamble, `DNS.1 = ${servername}`].join('\n'), () => {
        let gen_cert = spawn('./gen_cert.sh', [servername]);
        gen_cert.on('close', (code) => {
            if (code) {
                console.log(`Error on generating certificate for: ${servername}`);
                return;
            }
            certs[servername] = {cert: fs.readFileSync(`certificates/${servername}.crt`)};
            certs[servername].key = fs.readFileSync(`keys/${servername}.key`);
            let ctx = createSecureContext(certs[servername].key, certs[servername].cert);
            cb(null, ctx);
        })
    });
}

function SNICallback(servername, cb) {
    if (!(servername in certs)) {
        generateCertificate(servername, cb);
        return;
    }
    let ctx = createSecureContext(certs[servername].key, certs[servername].cert);
    cb(null, ctx)
}

function createRequestParser(socket, requestsStore, host, port, ssl) {
    const requestParser = new HTTPParser()//HTTPParser.REQUEST);
    requestParser.initialize(HTTPParser.REQUEST, new HTTPServerAsyncResource('HTTPINCOMINGMESSAGE', socket));


    requestParser[kOnMessageComplete] = function () {
        const req = requestsStore[requestsStore.length - 1];
        req.request = req.request + req.request_body.slice(0, maxBodySize).toString();
        req.request_time = new Date();
    };

    requestParser[kOnHeadersComplete] = function (versionMajor, versionMinor, headers, method, url) {
        let h = '';
        let headersObj = {};
        for (let i = 0; i < headers.length / 2; ++i) {
            headersObj[headers[i * 2]] = headers[i * 2 + 1];
            h += `${headers[i * 2]}: ${headers[i * 2 + 1]}\r\n`;
        }
        const r = `${methods[method]} ${url} HTTP/${versionMajor}.${versionMinor}\r\n${h}\r\n`
        const req = {
            _id: Number(requestCounter).toString(),
            method: methods[method],
            host: host,
            port: port,
            path: url,
            headers: headersObj,
            ssl: ssl,
            request: r,
            request_body: Buffer.from('')
        };
        requestCounter++;
        requestsStore.push(req)
    };

    requestParser[kOnBody] = function (b, start, len) {
        const req = requestsStore[requestsStore.length - 1];
        req.request_body = Buffer.concat([req.request_body, b.slice(start, start + len)])
    };

    return requestParser;
}

function httpConnection(req, _res) {
    if (req.url.startsWith('http')) {
        try {
            const parsedUrl = url.parse(req.url);
            const options = {
                host: parsedUrl.hostname,
                port: parsedUrl.port || 80
            };
            const proxyReq = net.connect(options, () => {
                const requestsStore = [];

                const requestParser = createRequestParser(req.socket, requestsStore, options.host, options.port, false);
                const responseParser = createResponseParser(proxyReq, requestsStore);

                req.socket.on('data', (chunk) => {
                    requestParser.execute(chunk)
                });
                req.socket.on('end', () => {
                    requestParser.finish()
                });
                proxyReq.on('data', (chunk) => {
                    responseParser.execute(chunk)
                });
                proxyReq.on('end', () => {
                    responseParser.finish()
                });


                let h = '';
                for (let i = 0; i < req.rawHeaders.length; i += 2) {
                    if (req.rawHeaders[i] !== 'Proxy-Connection') {
                        h += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
                    }
                }
                let p = Buffer.from(`${req.method} ${parsedUrl.path} HTTP/1.1\r\n${h}\r\n`)
                proxyReq.write(p);
                requestParser.execute(p);
                req.socket.pipe(proxyReq).pipe(req.socket);


            });
            proxyReq.on('error', (e) => {
                console.log(`proxyReq error ${e}`)
            })

        } catch (e) {
            console.log(`Unable to parse ${req.url}`)
        }
    }
}

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork()
    }

    cluster.on('exit', (worker) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    const httpServer = http.createServer(httpConnection);

    httpServer.on('error', () => {
        console.log('httpServer error')
    });

    httpServer.on('connect', (req, cltSocket) => {
        console.log(`connect ${req.url}`);
        cltSocket.on('error', (e) => {
            console.log(`cltSocket error ${e}`)
        });
        const u = req.url.split(':');
        const options = {
            rejectUnauthorized: false
        };
        if (u.length === 2) {
            options.host = u[0];
            options.port = u[1]
        } else {
            options.host = req.url;
            options.port = 443
        }
        const proxyReq = tls.connect(options, () => {
            cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                'Proxy-agent: Node.js-Proxy\r\n' +
                '\r\n');

            const requestsStore = [];

            const tlsOptions = {
                key: key,
                cert: cert,
                SNICallback: SNICallback,
                isServer: true
            };
            const tlsSocket = new tls.TLSSocket(cltSocket, tlsOptions);
            const requestParser = createRequestParser(tlsSocket, requestsStore, options.host, options.port, true);
            const responseParser = createResponseParser(proxyReq, requestsStore);

            tlsSocket.pipe(proxyReq).pipe(tlsSocket);

            tlsSocket.on('data', (chunk) => {
                requestParser.execute(chunk)
            });
            tlsSocket.on('end', () => {
                requestParser.finish()
            });
            proxyReq.on('data', (chunk) => {
                responseParser.execute(chunk)
            });
            proxyReq.on('end', () => {
                responseParser.finish()
            });
        });

        proxyReq.on('error', (e) => {
            console.log(`proxyReq error ${e}`)
        })
    });


    httpServer.listen(port, 8081);
}