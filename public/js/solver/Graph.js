import { Vertex } from './Vertex.js';

export class Graph {
    constructor(size) {
        this.adjacencyMatrix = Array.from({ length: size }, () => Array(size).fill(false));
        this.vertexToIndex = Array(size).fill(0);
        this.numVertices = size;
    }

    static async readFromFile(path) {
        const fs = require('fs').promises;

        try {
            const contents = await fs.readFile(path, 'utf8');

            const nodeRe = /node\s*\[\s*id\s+(\d+)/g;
            const edgeRe = /edge\s*\[\s*source\s+(\d+)\s+target\s+(\d+)/g;

            if (!contents.trim().startsWith("graphState [")) {
                throw new Error("Invalid GML format: missing 'graphState [' header");
            }

            const vertices = [];
            let match;
            while ((match = nodeRe.exec(contents)) !== null) {
                vertices.push(parseInt(match[1], 10));
            }

            if (vertices.length === 0) {
                throw new Error("Invalid GML format: no vertices found");
            }

            const graph = new Graph(vertices.length);
            vertices.forEach((vertexId, index) => {
                graph.vertexToIndex[index] = vertexId;
            });

            while ((match = edgeRe.exec(contents)) !== null) {
                const source = parseInt(match[1], 10);
                const target = parseInt(match[2], 10);

                const sourceIdx = graph.getIndex(source);
                const targetIdx = graph.getIndex(target);

                if (sourceIdx !== undefined && targetIdx !== undefined) {
                    graph.adjacencyMatrix[sourceIdx][targetIdx] = true;
                    graph.adjacencyMatrix[targetIdx][sourceIdx] = true;
                } else {
                    throw new Error(`Edge references nonexistent vertex: ${source} or ${target}`);
                }
            }

            return graph;
        } catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    getIndex(vertexId) {
        return this.vertexToIndex.indexOf(vertexId);
    }

    getVertexByIndex(index) {
        const id = this.vertexToIndex[index];
        return id !== undefined ? new Vertex(id) : null;
    }

    getVertices() {
        return this.vertexToIndex.map(id => new Vertex(id));
    }

    getNeighbours(vertex) {
        const uIdx = this.getIndex(vertex.getId());
        if (uIdx !== undefined) {
            return this.adjacencyMatrix[uIdx]
                .map((connected, idx) => connected ? this.getVertexByIndex(idx) : null)
                .filter(v => v !== null);
        }
        return [];
    }

    collapseNeighbours(vertex) {
        const neighbours = this.getNeighbours(vertex);

        if (neighbours.length !== 3) {
            throw new Error(`Vertex ${vertex.getId()} must have exactly 3 neighbours, has ${neighbours.length}`);
        }

        const uIdx = this.getIndex(vertex.getId());
        if (uIdx === undefined) {
            throw new Error(`Vertex ${vertex.getId()} not found`);
        }

        const neighbourIndices = neighbours.map(n => this.getIndex(n.getId()));

        if (neighbourIndices.includes(undefined)) {
            throw new Error(`Could not find all neighbour indices for vertex ${vertex.getId()}`);
        }

        const newSize = this.numVertices - 3;
        const newGraph = new Graph(newSize);

        const oldToNew = Array(this.numVertices).fill(null);
        let newIdx = 0;

        oldToNew[uIdx] = 0;
        newGraph.vertexToIndex[0] = this.vertexToIndex[uIdx];

        for (let oldIdx = 0; oldIdx < this.numVertices; oldIdx++) {
            if (!neighbourIndices.includes(oldIdx) && oldIdx !== uIdx) {
                newIdx++;
                oldToNew[oldIdx] = newIdx;
                newGraph.vertexToIndex[newIdx] = this.vertexToIndex[oldIdx];
            }
        }

        for (let oldI = 0; oldI < this.numVertices; oldI++) {
            const newI = oldToNew[oldI];
            if (newI !== null) {
                for (let oldJ = 0; oldJ < this.numVertices; oldJ++) {
                    const newJ = oldToNew[oldJ];
                    if (newJ !== null) {
                        newGraph.adjacencyMatrix[newI][newJ] = this.adjacencyMatrix[oldI][oldJ];
                    }
                }
            }
        }

        neighbourIndices.forEach(nIdx => {
            for (let oldIdx = 0; oldIdx < this.numVertices; oldIdx++) {
                if (this.adjacencyMatrix[nIdx][oldIdx] && !neighbourIndices.includes(oldIdx) && oldIdx !== uIdx) {
                    const newIdx = oldToNew[oldIdx];
                    if (newIdx !== null) {
                        newGraph.adjacencyMatrix[0][newIdx] = true;
                        newGraph.adjacencyMatrix[newIdx][0] = true;
                    }
                }
            }
        });

        return newGraph;
    }
}