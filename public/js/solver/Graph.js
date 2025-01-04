import { CatalanError } from './CatalanError.js';
import { Vertex } from './Vertex.js';

class Graph {
    constructor(size) {
        this.adjacencyMatrix = Array(size).fill().map(() => Array(size).fill(false));
        this.vertexToIndex = Array(size).fill(0);
        this.numVertices = size;
    }

    static parseGmlContent(content) {
        // GML Parser-Implementierung
        if (!content.trim().startsWith('graph [')) {
            throw new CatalanError(
                CatalanError.types.GML_PARSE_ERROR,
                "Invalid GML format: missing 'graph [' header"
            );
        }

        // Regex für Nodes und Edges
        const nodeRegex = /node\s*\[\s*id\s+(\d+)/g;
        const edgeRegex = /edge\s*\[\s*source\s+(\d+)\s+target\s+(\d+)/g;

        // Vertices extrahieren
        const vertices = [];
        let match;
        while ((match = nodeRegex.exec(content)) !== null) {
            vertices.push(parseInt(match[1]));
        }

        if (vertices.length === 0) {
            throw new CatalanError(
                CatalanError.types.GML_PARSE_ERROR,
                "Invalid GML format: no vertices found"
            );
        }

        // Graph initialisieren
        const graph = new Graph(vertices.length);
        vertices.forEach((vertexId, index) => {
            graph.vertexToIndex[index] = vertexId;
        });

        // Kanten verarbeiten
        while ((match = edgeRegex.exec(content)) !== null) {
            const source = parseInt(match[1]);
            const target = parseInt(match[2]);

            const sourceIdx = graph.getIndex(source);
            const targetIdx = graph.getIndex(target);

            if (sourceIdx !== undefined && targetIdx !== undefined) {
                graph.adjacencyMatrix[sourceIdx][targetIdx] = true;
                graph.adjacencyMatrix[targetIdx][sourceIdx] = true;
            } else {
                throw new CatalanError(
                    CatalanError.types.GML_PARSE_ERROR,
                    `Edge references nonexistent vertex: ${source} or ${target}`
                );
            }
        }

        return graph;
    }

    getIndex(vertexId) {
        return this.vertexToIndex.findIndex(id => id === vertexId);
    }

    getVertexByIndex(index) {
        return index < this.vertexToIndex.length ? new Vertex(this.vertexToIndex[index]) : null;
    }

    getVertices() {
        return this.vertexToIndex.map(id => new Vertex(id));
    }

    getNeighbours(vertex) {
        const idx = this.getIndex(vertex.getId());
        if (idx === -1) return [];

        return this.adjacencyMatrix[idx]
            .map((connected, index) => connected ? this.getVertexByIndex(index) : null)
            .filter(v => v !== null);
    }

    clone() {
        const newGraph = new Graph(this.numVertices);
        newGraph.adjacencyMatrix = this.adjacencyMatrix.map(row => [...row]);
        newGraph.vertexToIndex = [...this.vertexToIndex];
        return newGraph;
    }

    collapseNeighbours(vertex) {
        const neighbours = this.getNeighbours(vertex);

        if (neighbours.length !== 3) {
            throw new CatalanError(
                CatalanError.types.INVALID_VERTEX_OPERATION,
                `Vertex ${vertex.getId()} must have exactly 3 neighbours, has ${neighbours.length}`
            );
        }

        const vertexIdx = this.getIndex(vertex.getId());
        if (vertexIdx === -1) {
            throw new CatalanError(
                CatalanError.types.INVALID_VERTEX_OPERATION,
                `Vertex ${vertex.getId()} not found`
            );
        }

        // Nachbarindizes ermitteln
        const neighbourIndices = neighbours
            .map(n => this.getIndex(n.getId()))
            .filter(idx => idx !== -1);

        if (neighbourIndices.length !== 3) {
            throw new CatalanError(
                CatalanError.types.INVALID_VERTEX_OPERATION,
                `Could not find all neighbour indices for vertex ${vertex.getId()}`
            );
        }

        // Neuen Graphen erstellen
        const newSize = this.numVertices - 3;
        const newGraph = new Graph(newSize);

        // Mapping erstellen
        const oldToNew = Array(this.numVertices).fill(null);
        let newIdx = 0;

        // Zentraler Knoten behält ersten Index
        oldToNew[vertexIdx] = 0;
        newGraph.vertexToIndex[0] = this.vertexToIndex[vertexIdx];

        // Verbleibende Knoten kopieren
        for (let oldIdx = 0; oldIdx < this.numVertices; oldIdx++) {
            if (!neighbourIndices.includes(oldIdx) && oldIdx !== vertexIdx) {
                if (newIdx + 1 < newSize) {
                    newIdx++;
                    oldToNew[oldIdx] = newIdx;
                    newGraph.vertexToIndex[newIdx] = this.vertexToIndex[oldIdx];
                }
            }
        }

        // Verbindungen kopieren und aktualisieren
        for (let oldI = 0; oldI < this.numVertices; oldI++) {
            if (oldToNew[oldI] !== null) {
                for (let oldJ = 0; oldJ < this.numVertices; oldJ++) {
                    if (oldToNew[oldJ] !== null) {
                        newGraph.adjacencyMatrix[oldToNew[oldI]][oldToNew[oldJ]] =
                            this.adjacencyMatrix[oldI][oldJ];
                    }
                }
            }
        }

        // Nachbarn der kollabierten Knoten mit dem zentralen Vertex verbinden
        for (const nIdx of neighbourIndices) {
            for (let oldIdx = 0; oldIdx < this.numVertices; oldIdx++) {
                if (this.adjacencyMatrix[nIdx][oldIdx] &&
                    !neighbourIndices.includes(oldIdx) &&
                    oldIdx !== vertexIdx) {
                    if (oldToNew[oldIdx] !== null) {
                        newGraph.adjacencyMatrix[0][oldToNew[oldIdx]] = true;
                        newGraph.adjacencyMatrix[oldToNew[oldIdx]][0] = true;
                    }
                }
            }
        }

        return newGraph;
    }
}
export { Graph };