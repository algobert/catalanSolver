class Move {
    constructor(selectedVertex, beforeState, afterState) {
        this.selectedVertex = selectedVertex;
        this.beforeState = beforeState;
        this.afterState = afterState;
    }

    toString() {
        return `select vertex ${this.selectedVertex.getId()}`;
    }
}

export { Move };