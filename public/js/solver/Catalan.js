import { Graph } from './Graph.js';
import { Move } from './Move.js';

export class Catalan {
    constructor(initialGraph) {
        this.initialGraph = initialGraph;
    }

    static async new(path) {
        const graph = await Graph.readFromFile(path);
        return new Catalan(graph);
    }

    async solve() {
        const queue = [];
        const visited = new Set();

        queue.push({ graph: this.initialGraph, moves: [] });
        visited.add(this.generateStateKey(this.initialGraph));

        while (queue.length > 0) {
            const { graph: currentGraph, moves } = queue.shift();

            if (currentGraph.numVertices === 1) {
                return moves;
            }

            const vertices = currentGraph.getVertices().sort((a, b) => a.getId() - b.getId());

            for (const vertex of vertices) {
                const neighbours = currentGraph.getNeighbours(vertex);
                if (neighbours.length === 3) {
                    try {
                        const beforeState = currentGraph;
                        const afterState = beforeState.collapseNeighbours(vertex);
                        const stateKey = this.generateStateKey(afterState);

                        if (!visited.has(stateKey)) {
                            visited.add(stateKey);
                            const newMoves = [...moves, new Move(vertex, beforeState, afterState)];
                            queue.push({ graph: afterState, moves: newMoves });
                        }
                    } catch (error) {
                        console.error(`Failed to collapse vertex ${vertex.getId()}: ${error.message}`);
                    }
                }
            }
        }

        throw new Error("Game is unsolvable");
    }

    generateStateKey(graph) {
        const vertices = graph.getVertices().sort((a, b) => a.getId() - b.getId());
        let key = `V${vertices.length}:`;

        vertices.forEach(vertex => {
            const neighbours = graph.getNeighbours(vertex).sort((a, b) => a.getId() - b.getId());
            const neighbourIds = neighbours.map(v => v.getId()).join(",");
            key += `${vertex.getId()}:[${neighbourIds}]`;
        });

        return key;
    }
}