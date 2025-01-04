import { solveCatalanGmlContent } from './Catalan.js';

class AutoSolver {
    constructor(graph) {
        this.graph = graph;
        this.solving = false;
        this.moveQueue = [];
    }

    async solve(gmlContent) {
        console.log("Starting solve process...");
        if (this.solving) return;

        try {
            console.log("Getting solution from solver...");
            // Get solution moves from solver
            const moves = solveCatalanGmlContent(gmlContent);
            console.log("Got moves:", moves);

            // Queue the moves
            this.moveQueue = moves;
            this.solving = true;

            // Execute moves one by one with animation delay
            while (this.moveQueue.length > 0 && this.solving) {
                const nodeId = this.moveQueue.shift();

                // Find the node in the game's graph
                const node = this.graph.nodes.find(n => n.id === nodeId);
                if (node) {
                    console.log("Executing move for node:", nodeId);
                    // Simulate a click on the node
                    this.graph.handleNodeClick(nodeId);

                    // Wait for animation to complete
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            this.solving = false;
        } catch (error) {
            console.error('Solver error:', error);
            this.solving = false;
        }
    }

    stop() {
        this.solving = false;
        this.moveQueue = [];
    }
}

export { AutoSolver };