class Vertex {
    constructor(id) {
        this.id = id;
    }

    getId() {
        return this.id;
    }

    toString() {
        return `Vertex(${this.id})`;
    }

    static compare(a, b) {
        return a.id - b.id;
    }
}

export { Vertex };