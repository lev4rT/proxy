let preamble = [
    'authorityKeyIdentifier=keyid,issuer',
    'basicConstraints=CA:FALSE',
    'keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment',
    'subjectAltName = @alt_names',
    '[alt_names]',
]

const maxBodySize = 2000000;
const certs = {};


const port = 8080;

module.exports = {preamble, maxBodySize, certs, port};