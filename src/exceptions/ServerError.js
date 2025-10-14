class ServerError extends Error {
    constructor(message = 'Terjadi kesalahan pada server', statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ServerError';
    }
}

module.exports = ServerError;