import { Move } from './Move.js';
import { Graph } from './Graph.js';
import { Vertex } from './Vertex.js';
import { CatalanError } from './CatalanError.js';

class Catalan {
    constructor(initialGraph) {
        this.initialGraph = initialGraph;
    }

    static parseGmlContent(content) {
        const graph = Graph.parseGmlContent(content);
        return new Catalan(graph);
    }

    solve() {
        const queue = [{ graph: this.initialGraph.clone(), moves: [] }];
        const visited = new Set();

        // Initial state key generieren und hinzufügen
        visited.add(this.generateStateKey(this.initialGraph));

        while (queue.length > 0) {
            const { graph, moves } = queue.shift();

            // Erfolg wenn nur noch ein Knoten übrig ist
            if (graph.numVertices === 1) {
                return moves;
            }

            // Mögliche Züge finden
            const vertices = graph.getVertices().sort(Vertex.compare);

            for (const vertex of vertices) {
                const neighbours = graph.getNeighbours(vertex);
                if (neighbours.length === 3) {
                    const beforeState = graph.clone();

                    try {
                        const afterState = beforeState.collapseNeighbours(vertex);
                        const stateKey = this.generateStateKey(afterState);

                        if (!visited.has(stateKey)) {
                            visited.add(stateKey);
                            const newMoves = [...moves, new Move(vertex, beforeState, afterState)];
                            queue.push({ graph: afterState, moves: newMoves });
                        }
                    } catch (error) {
                        // Fehler beim Kollabieren ignorieren und weitermachen
                        continue;
                    }
                }
            }
        }

        throw new CatalanError(
            CatalanError.types.UNSOLVABLE_GAME,
            "Game is unsolvable"
        );
    }

    generateStateKey(graph) {
        const vertices = graph.getVertices().sort(Vertex.compare);

        let key = `V${vertices.length}:`;

        for (const vertex of vertices) {
            const neighbours = graph.getNeighbours(vertex)
                .sort(Vertex.compare)
                .map(v => v.getId());

            key += `${vertex.getId()}:[${neighbours.join(',')}]`;
        }

        return key;
    }
}

// Hauptfunktion, die das gleiche Format wie die Rust-Version zurückgibt
function solveCatalanGmlContent(gmlContent) {
    try {
        const game = Catalan.parseGmlContent(gmlContent);
        const moves = game.solve();

        if (moves.length === 0) {
            return [];
        } else {
            // Extrahiere nur die IDs der Knoten aus den Moves
            return moves.map(move => move.selectedVertex.getId());
        }
    } catch (error) {
        throw error;
    }
}

// Export der Klassen und Funktionen
export { Catalan, solveCatalanGmlContent };