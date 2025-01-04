class CatalanError extends Error {
    constructor(type, message) {
        super(message);
        this.type = type;
        this.name = 'CatalanError';
    }

    static get types() {
        return {
            FILE_ERROR: 'FileError',
            GML_PARSE_ERROR: 'GMLParseError',
            UNSOLVABLE_GAME: 'UnsolvableGame',
            INVALID_VERTEX_OPERATION: 'InvalidVertexOperation'
        };
    }
}

export { CatalanError };