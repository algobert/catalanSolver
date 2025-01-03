// js/autoSolver.js

import { Catalan } from './Catalan.js';

export class AutoSolver {
    constructor(graphState) {
        this.graphState = graphState;
        this.isRunning = false;
    }

    async solveCatalanGmlContent(content) {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            const catalan = Catalan.parseGmlContent(content);
            const solution = catalan.solve();

            for (const move of solution) {
                await this.animateMove(move);
            }
        } catch (error) {
            console.error('Solving failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    async animateMove(move) {
        const selectedVertex = move.selectedVertex;
        const neighbours = move.beforeState.getNeighbours(selectedVertex);
        const neighbourIds = neighbours.map(v => v.getId());

        this.graphState.selectNode(selectedVertex.getId());
        await this.graphState.shakeNode(selectedVertex.getId());
        await this.graphState.suckNodes(selectedVertex.getId(), neighbourIds);

        // Graph aktualisieren
        await this.updateGraphState(move.afterState);
    }

    async updateGraphState(newState) {
        // Bestehenden Graph löschen
        this.graphState.clear();

        // Neuen Graph aufbauen
        const vertices = newState.getVertices();
        vertices.forEach(vertex => {
            this.graphState.addNode(vertex.getId(), vertex.getId().toString());
        });

        // Kanten hinzufügen
        vertices.forEach(vertex => {
            const neighbours = newState.getNeighbours(vertex);
            neighbours.forEach(neighbour => {
                if (vertex.getId() < neighbour.getId()) {
                    this.graphState.addEdge(vertex.getId(), neighbour.getId());
                }
            });
        });

        this.graphState.layout();

        // Kurze Pause für die Animation
        return new Promise(resolve => setTimeout(resolve, 500));
    }
}