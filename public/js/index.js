// Exports
export { Vertex } from './Vertex.js';
export { Graph } from './Graph.js';
export { Move } from './Move.js';
export { Catalan } from './Catalan.js';
export { CatalanError } from './CatalanError.js';

// Anwendungslogik
import { GraphState } from './GraphState.js';
import { AutoSolver } from './autoSolver.js';

window.initializeGame = async function() {
    try {
        // Erstelle die GraphState-Instanz
        const container = document.getElementById('graph-container');
        const graphState = new GraphState(container);

        // Erstelle die AutoSolver-Instanz
        const autoSolver = new AutoSolver(graphState);

        // File Input Handler
        const fileInput = document.getElementById('file-input');
        fileInput?.addEventListener('change', async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    await graphState.loadFromGML(content);
                    await autoSolver.solveCatalanGmlContent(content);
                }
            };
            reader.readAsText(file);
        });

        // Speichere die Instanzen global
        window.graphState = graphState;
        window.autoSolver = autoSolver;

    } catch(e) {
        console.error("Initialization failed:", e);
        throw e;
    }
}

// Starte die Initialisierung
window.initializeGame();