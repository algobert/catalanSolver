class AutoSolver {
    constructor(graphState) {
        this.graphState = graphState;
        this.wasmModule = null;
        this.isAutoSolving = false;
    }

    setWasmModule(module) {
        this.wasmModule = module;
        console.log("WASM module set in AutoSolver");
    }

    async getSolution() {
        if (!this.wasmModule) {
            console.error("WASM module not loaded");
            return null;
        }

        try {
            const response = await fetch(this.graphState.currentGmlPath);
            const gmlContent = await response.text();
            const solution = await this.wasmModule.solve_catalan_gml_content(gmlContent);
            return solution;
        } catch (e) {
            console.error("Error solving puzzle:", e);
            return null;
        }
    }


    async autoSolve() {
        if (this.isAutoSolving) return;
        this.isAutoSolving = true;

        const solution = await this.getSolution();
        if (!solution) {
            this.isAutoSolving = false;
            return;
        }

        // Führe die Züge nacheinander aus
        for (const nodeId of solution) {
            // Warte 2 Sekunde zwischen den Zügen für die Animation
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Finde den Knoten
            const node = this.graphState.nodes.find(n => n.id === nodeId);
            if (node) {
                // Emuliere den Klick auf den Knoten
                this.graphState.handleNodeClick(nodeId);
            }
        }

        this.isAutoSolving = false;
    }
}

// Initialisiere den AutoSolver mit der bestehenden GraphState-Instanz
const autoSolver = new AutoSolver(graph);

// Event Listener für den Solve-Button
document.getElementById('solveButton').addEventListener('click', () => {
    autoSolver.autoSolve();
});