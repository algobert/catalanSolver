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

    // Vergleichsmethode für die Sortierung
    static compare(a, b) {
        return a.id - b.id;
    }
}