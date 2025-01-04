import { Catalan } from './Catalan.js';
import { Graph } from './Graph.js';

class AutoSolver {
    constructor(graphState) {
        this.graphState = graphState;
        this.solution = null;
        this.isExecuting = false;
    }

    async solve() {
        try {
            // Konvertiere GraphState zu Graph
            const graph = new Graph(this.graphState.nodes.length);

            // Setze die Vertex IDs
            this.graphState.nodes.forEach((node, index) => {
                graph.vertexToIndex[index] = node.id;
            });

            // Füge die Kanten hinzu
            this.graphState.edges.forEach(edge => {
                const sourceIdx = graph.getIndex(edge.source);
                const targetIdx = graph.getIndex(edge.target);
                graph.adjacencyMatrix[sourceIdx][targetIdx] = true;
                graph.adjacencyMatrix[targetIdx][sourceIdx] = true;
            });

            const catalan = new Catalan(graph);
            this.solution = await catalan.solve();
        } catch (error) {
            console.error("Fehler beim Lösen:", error.message);
            this.solution = null;
        }
    }

    async executeSolution() {
        if (!this.solution) {
            console.log("Keine Lösung verfügbar");
            return;
        }
        if (this.isExecuting) {
            console.log("Lösung wird bereits ausgeführt");
            return;
        }

        this.isExecuting = true;
        console.log("Starte Ausführung der Lösung");

        const nodeIds = this.solution.map(move => move.selectedVertex.getId());
        console.log("Lösungsschritte:", nodeIds);

        try {
            for (let nodeId of nodeIds) {
                // Wait until any ongoing sucking animation is complete
                while (this.graphState && this.graphState.isSucking) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                if (this.graphState) {
                    console.log("Führe Zug aus für Knoten:", nodeId);
                    this.graphState.handleNodeClick(nodeId);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            console.error("Fehler bei der Ausführung:", error);
        }

        console.log("Lösungsausführung abgeschlossen");
        this.isExecuting = false;
    }
}

export { AutoSolver };