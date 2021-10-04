class HTTPServerAsyncResource {
    constructor(type, socket) {
        this.type = type;
        this.socket = socket;
    }
}

module.exports = {HTTPServerAsyncResource};