// public/js/GraphState.js

export class GraphState {
    constructor(container) {
        this.container = container;
        this.nodes = new Map();
        this.edges = new Map();
        this.selectedNode = null;
        this.animationQueue = [];
        this.isAnimating = false;
        this.popSound = new Audio('/assets/audio/pop.mp3');
    }

    async loadFromGML(content) {
        this.clear();

        const nodeRegex = /node\s*\[\s*id\s+(\d+)\s+label\s+"([^"]+)"\s*\]/g;
        const edgeRegex = /edge\s*\[\s*source\s+(\d+)\s+target\s+(\d+)\s*\]/g;

        let match;
        while ((match = nodeRegex.exec(content)) !== null) {
            const [, id, label] = match;
            this.addNode(parseInt(id), label);
        }

        while ((match = edgeRegex.exec(content)) !== null) {
            const [, source, target] = match;
            this.addEdge(parseInt(source), parseInt(target));
        }

        this.layout();
    }

    addNode(id, label) {
        const node = document.createElement('div');
        node.className = 'node';
        node.textContent = label || id;
        node.dataset.id = id;

        node.addEventListener('click', () => this.handleNodeClick(id));

        this.container.appendChild(node);
        this.nodes.set(id, node);
        return node;
    }

    addEdge(sourceId, targetId) {
        const edge = document.createElement('div');
        edge.className = 'edge';
        this.container.insertBefore(edge, this.container.firstChild);

        const key = this.getEdgeKey(sourceId, targetId);
        this.edges.set(key, edge);
        return edge;
    }

    getEdgeKey(sourceId, targetId) {
        return sourceId < targetId ?
            `${sourceId}-${targetId}` :
            `${targetId}-${sourceId}`;
    }

    layout() {
        const centerX = this.container.clientWidth / 2;
        const centerY = this.container.clientHeight / 2;
        const radius = Math.min(centerX, centerY) * 0.8;

        const nodeArray = Array.from(this.nodes.entries());
        const angleStep = (2 * Math.PI) / nodeArray.length;

        nodeArray.forEach(([id, node], index) => {
            const angle = index * angleStep;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
        });

        this.updateEdges();
    }

    updateEdges() {
        this.edges.forEach((edge, key) => {
            const [sourceId, targetId] = key.split('-').map(Number);
            const sourceNode = this.nodes.get(sourceId);
            const targetNode = this.nodes.get(targetId);

            if (sourceNode && targetNode) {
                this.positionEdge(edge, sourceNode, targetNode);
            }
        });
    }

    positionEdge(edge, sourceNode, targetNode) {
        const sourceRect = sourceNode.getBoundingClientRect();
        const targetRect = targetNode.getBoundingClientRect();

        const sourceX = sourceRect.left + sourceRect.width / 2;
        const sourceY = sourceRect.top + sourceRect.height / 2;
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
        const length = Math.sqrt(
            Math.pow(targetX - sourceX, 2) +
            Math.pow(targetY - sourceY, 2)
        );

        edge.style.width = `${length}px`;
        edge.style.left = `${sourceX}px`;
        edge.style.top = `${sourceY}px`;
        edge.style.transform = `rotate(${angle}rad)`;
    }

    clear() {
        this.nodes.forEach(node => node.remove());
        this.edges.forEach(edge => edge.remove());
        this.nodes.clear();
        this.edges.clear();
        this.selectedNode = null;
    }

    handleNodeClick(id) {
        const node = this.nodes.get(id);
        if (!node) return;

        if (this.selectedNode === id) {
            this.deselectNode();
        } else {
            this.selectNode(id);
        }
    }

    selectNode(id) {
        this.deselectNode();
        const node = this.nodes.get(id);
        if (node) {
            node.classList.add('selected');
            this.selectedNode = id;
        }
    }

    deselectNode() {
        if (this.selectedNode !== null) {
            const node = this.nodes.get(this.selectedNode);
            if (node) {
                node.classList.remove('selected');
            }
            this.selectedNode = null;
        }
    }

    async shakeNode(nodeId) {
        return new Promise(resolve => {
            const node = this.nodes.get(nodeId);
            if (!node) {
                resolve();
                return;
            }

            this.popSound.play().catch(console.error);
            node.classList.add('shake');

            setTimeout(() => {
                node.classList.remove('shake');
                resolve();
            }, 500);
        });
    }

    async suckNodes(centerNodeId, neighbourIds) {
        return new Promise(resolve => {
            const centerNode = this.nodes.get(centerNodeId);
            if (!centerNode) {
                resolve();
                return;
            }

            const neighbours = neighbourIds
                .map(id => this.nodes.get(id))
                .filter(node => node);

            neighbours.forEach(node => {
                node.classList.add('sucked');
                node.style.transition = 'all 0.5s ease-in';

                const centerRect = centerNode.getBoundingClientRect();
                const centerX = centerRect.left + centerRect.width / 2;
                const centerY = centerRect.top + centerRect.height / 2;

                node.style.left = `${centerX}px`;
                node.style.top = `${centerY}px`;
            });

            setTimeout(() => {
                neighbours.forEach(node => node.remove());
                resolve();
            }, 500);
        });
    }

    async showLoading() {
        const loading = document.createElement('img');
        loading.src = '/assets/img/loading.gif';
        loading.className = 'loading';
        this.container.appendChild(loading);
        return loading;
    }

    hideLoading(loadingElement) {
        if (loadingElement && loadingElement.parentNode) {
            loadingElement.remove();
        }
    }
}