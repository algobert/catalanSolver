export class Vertex {
    constructor(id) {
        this.id = id;
    }

    getId() {
        return this.id;
    }

    toString() {
        return `Vertex(${this.id})`;
    }
}