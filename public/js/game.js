import { AutoSolver } from './solver/CatalanSolver.js';

// Linear Congruential Generator (LCG)
function SeededRandomGenerator(seed) {
    this.seed = seed;

    this.next = function () {
        const a = 1664525;
        const c = 1013904223;
        const m = Math.pow(2, 32);
        this.seed = (a * this.seed + c) % m;
        return this.seed / m;
    }
}

class GraphState {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.nodeRadius = 20;
        this.draggingNode = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.suckTimeout = null;
        this.isSucking = false;
        this.mouseDownTime = 0;
        this.solvedLevels = new Set();
        this.currentLevel = '';
        this.undoStack = [];
        this.levels = [];
        this.showNodeLabels = true;
    }

    saveState() {
        const state = {
            nodes: JSON.parse(JSON.stringify(this.nodes)),
            edges: JSON.parse(JSON.stringify(this.edges)),
        };
        this.undoStack.push(state);
    }

    undo() {
        if (this.undoStack.length > 0) {
            const lastState = this.undoStack.pop();
            this.nodes = lastState.nodes.map(node => ({
                ...node,
                vx: 0,
                vy: 0,
            }));
            this.edges = lastState.edges;
            this.draw(ctx);
        }
    }

    setNodeLabels(checked) {
        this.showNodeLabels = checked;
        this.draw(ctx);
    }

    addNode(id, x = Math.random() * canvas.width, y = Math.random() * canvas.height) {
        this.nodes.push({ id, x, y, vx: 0, vy: 0 });
    }

    addEdge(source, target) {
        this.edges.push({ source, target });
    }

    getNodeNeighbors(nodeId) {
        return this.edges
            .filter(edge => edge.source === nodeId || edge.target === nodeId)
            .map(edge => edge.source === nodeId ? edge.target : edge.source);
    }

    mergeNodes(nodeId) {
        const neighbors = this.getNodeNeighbors(nodeId);
        if (neighbors.length !== 3) return;

        const allNeighbors = new Set();
        neighbors.forEach(n => {
            this.getNodeNeighbors(n).forEach(neighborId => {
                if (neighborId !== nodeId && !neighbors.includes(neighborId)) {
                    allNeighbors.add(neighborId);
                }
            });
        });

        this.saveState();
        this.nodes = this.nodes.filter(node => !neighbors.includes(node.id));
        this.edges = this.edges.filter(edge =>
            !(neighbors.includes(edge.source) || neighbors.includes(edge.target))
        );

        allNeighbors.forEach(neighborId => {
            this.addEdge(nodeId, neighborId);
        });

        this.isSucking = false;

        if (this.nodes.length === 1) {
            this.displaySuccess();
            setTimeout(() => this.loadNextLevel(), 2000);
        }
    }




    applyForces() {
        const attractionForce = 0.001;  // Reduced attraction force
        const repulsionForce = 20000;    // Reduced repulsion force
        const barycentricForce = 0.01;  // Reduced barycentric force
        const centerForce = 0.004;      // Reduced centering force
        const dampingFactor = 0.9;     // Damping factor to reduce velocity over time
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        this.nodes.forEach(node => {
            if (this.draggingNode === node || this.isSucking) return;

            // Initialize velocities
            node.vx = 0;
            node.vy = 0;

            // Force to bring nodes towards the center of the canvas
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            node.vx += (centerX - node.x) * centerForce;
            node.vy += (centerY - node.y) * centerForce;

            // Barycentric placement adjustment
            const neighbors = this.getNodeNeighbors(node.id);
            if (neighbors.length > 0) {
                let barycenterX = 0;
                let barycenterY = 0;

                neighbors.forEach(neighborId => {
                    const neighbor = this.nodes.find(n => n.id === neighborId);
                    barycenterX += neighbor.x;
                    barycenterY += neighbor.y;
                });

                barycenterX /= neighbors.length;
                barycenterY /= neighbors.length;

                node.vx += (barycenterX - node.x) * barycentricForce;
                node.vy += (barycenterY - node.y) * barycentricForce;
            }

            // Node repulsion forces
            this.nodes.forEach(otherNode => {
                if (node !== otherNode) {
                    const dx = node.x - otherNode.x;
                    const dy = node.y - otherNode.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > 0) {
                        const force = repulsionForce / (distance * distance);
                        node.vx += (dx / distance) * force;
                        node.vy += (dy / distance) * force;
                    }
                }
            });

            // Edge attraction forces
            this.edges.forEach(edge => {
                const source = this.nodes.find(n => n.id === edge.source);
                const target = this.nodes.find(n => n.id === edge.target);

                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    const force = (distance - 100) * attractionForce;
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;

                    source.vx += fx;
                    source.vy += fy;
                    target.vx -= fx;
                    target.vy -= fy;
                }
            });

            // Apply damping to slow down movements (simulates friction)
            node.vx *= dampingFactor;
            node.vy *= dampingFactor;

            // Apply velocity changes to node position
            node.x += node.vx;
            node.y += node.vy;

            // Prevent the node from going out of bounds
            node.x = Math.max(this.nodeRadius, Math.min(node.x, canvasWidth - this.nodeRadius));
            node.y = Math.max(this.nodeRadius, Math.min(node.y, canvasHeight - this.nodeRadius));
        });
    }



    update() {
        this.applyForces();
        this.nodes.forEach(node => {
            if (node !== this.draggingNode && !this.isSucking) {
                node.x += node.vx;
                node.y += node.vy;
            }
        });
    }

    draw(ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'white';

        this.edges.forEach(edge => {
            const source = this.nodes.find(node => node.id === edge.source);
            const target = this.nodes.find(node => node.id === edge.target);
            if (source && target) {
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
            }
        });

        this.nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, this.nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();
            if (this.showNodeLabels) {
                ctx.fillStyle = 'white';
                ctx.font = "30px Arial";
                ctx.textAlign = "center";
                ctx.fillText(node.id, node.x, node.y + 10);
            }
            ctx.stroke();
        });
    }

    handleNodeClick(nodeId) {
        const neighbors = this.getNodeNeighbors(nodeId);
        if (neighbors.length === 3 && !this.isSucking) {
            this.playSuckSound();
            this.suckNodes(nodeId);
        } else {
            this.shakeNode(nodeId);
        }
    }

    playLevelSound() {
        const levelSound = document.getElementById('levelSound');
        levelSound.volume = 0.1;
        levelSound.play();
    }


    playSuckSound() {
        const suckSound = document.getElementById('suckSound');
        suckSound.currentTime = 0;
        suckSound.volume = 0.1;
        suckSound.play().catch(error => {
            console.error('Error playing suck sound:', error);
        });
    }

    suckNodes(nodeId) {
        const neighbors = this.getNodeNeighbors(nodeId);
        const mergingNode = this.nodes.find(node => node.id === nodeId);
        const originalX = mergingNode.x;
        const originalY = mergingNode.y;

        if (!mergingNode || this.suckTimeout || this.isSucking) return;

        this.isSucking = true;
        let steps = 50;

        const animateSuck = () => {
            if (steps-- > 0) {
                neighbors.forEach(neighborId => {
                    const neighbor = this.nodes.find(node => node.id === neighborId);
                    if (neighbor) {
                        neighbor.x += (mergingNode.x - neighbor.x) * 0.1;
                        neighbor.y += (mergingNode.y - neighbor.y) * 0.1;
                    }
                });

                this.applyForces();
                this.draw(ctx);
                this.suckTimeout = setTimeout(animateSuck, 16);
            } else {
                clearTimeout(this.suckTimeout);
                this.suckTimeout = null;
                mergingNode.x = originalX;
                mergingNode.y = originalY;
                this.mergeNodes(nodeId);
            }
        };
        animateSuck();
    }

    shakeNode(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        const originalX = node.x;
        const originalY = node.y;
        let steps = 10;
        const shakeAmount = 3;

        const animateShake = () => {
            if (steps-- > 0) {
                node.x = originalX + (Math.random() - 0.5) * shakeAmount;
                node.y = originalY + (Math.random() - 0.5) * shakeAmount;
                this.draw(ctx);
                setTimeout(animateShake, 50);
            } else {
                node.x = originalX;
                node.y = originalY;
            }
        };
        animateShake();
    }

    loadFromGML(gmlText, levelName) {
        this.gmlText = gmlText;
        this.nodes = [];
        this.edges = [];
        this.undoStack = [];

        // Initialize the seeded random generator with a fixed seed
        const seed = 42; // You can change the seed to any fixed number
        const seededRandom = new SeededRandomGenerator(seed);

        const lines = gmlText.split('\n');
        const nodeRegex = /^node\s+\[(.+)\]$/;
        const edgeRegex = /^edge\s+\[(.+)\]$/;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            let match;
            if ((match = nodeRegex.exec(trimmedLine))) {
                const content = match[1];
                const idMatch = /id\s+(\d+)/.exec(content);
                if (idMatch) {
                    const nodeId = parseInt(idMatch[1], 10);

                    // Generate deterministic x and y positions using the seeded random generator
                    const x = seededRandom.next() * 800; // Assuming canvas width is 800
                    const y = seededRandom.next() * 600; // Assuming canvas height is 600

                    this.addNode(nodeId, x, y);
                }
            } else if ((match = edgeRegex.exec(trimmedLine))) {
                const content = match[1];
                const sourceMatch = /source\s+(\d+)/.exec(content);
                const targetMatch = /target\s+(\d+)/.exec(content);
                if (sourceMatch && targetMatch) {
                    const sourceId = parseInt(sourceMatch[1], 10);
                    const targetId = parseInt(targetMatch[1], 10);
                    this.addEdge(sourceId, targetId);
                }
            }
        });

        this.playLevelSound();
        this.currentLevel = levelName;
        document.getElementById('currentLevelDisplay').textContent = `Level: ${levelName}`;
        this.hideSuccess();
    }

    loadNextLevel() {
        const currentIndex = this.levels.indexOf(this.currentLevel);
        if (currentIndex >= 0 && currentIndex < this.levels.length - 1) {
            const nextLevel = this.levels[currentIndex + 1];
            fetch(`/gml-files/${nextLevel}`)
                .then(response => response.text())
                .then(gmlText => {
                    this.loadFromGML(gmlText, nextLevel);
                    solver.solve(gmlText);
                });
        }
    }

    displaySuccess() {
        const successMessage = document.getElementById('successMessage');
        successMessage.style.display = 'block';
        successMessage.innerHTML = "SUCCESS!";
        if (!this.solvedLevels.has(this.currentLevel)) {
            this.solvedLevels.add(this.currentLevel);
            this.updateSolvedLevelsDisplay();
        }
    }

    hideSuccess() {
        const successMessage = document.getElementById('successMessage');
        successMessage.style.display = 'none';
    }

    updateSolvedLevelsDisplay() {
        const solvedLevelsDiv = document.getElementById('solvedLevels');
        const solvedArray = Array.from(this.solvedLevels);
        solvedLevelsDiv.innerHTML = `Solved Levels: ${solvedArray.length > 0 ? solvedArray.join(', ') : 'None'}`;
    }
}

// Adjust canvas to full window size
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const graph = new GraphState();
const solver = new AutoSolver(graph);

function animate() {
    graph.update();
    graph.draw(ctx);
    requestAnimationFrame(animate);
}

animate();

// Load levels dynamically and sort numerically by level_X
fetch('/gml-files')
    .then(response => response.json())
    .then(files => {
        files.sort((a, b) => {
            const aNum = parseInt(a.match(/\d+/)[0], 10);
            const bNum = parseInt(b.match(/\d+/)[0], 10);
            return aNum - bNum;
        });

        graph.levels = files;
        const select = document.getElementById('gmlSelect');
        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            option.text = file;
            select.appendChild(option);
        });

        // Automatically load the first level
        if (files.length > 0) {
            fetch(`/gml-files/${files[0]}`)
                .then(response => response.text())
                .then(gmlText => {
                    graph.loadFromGML(gmlText, files[0]);
                    solver.solve(gmlText);
                });
        }
    });

document.getElementById('nodeLabels').addEventListener('change', function (event) {
    const checked = event.target.checked;
    graph.setNodeLabels(checked);
});

document.getElementById('gmlSelect').addEventListener('change', function (event) {
    const selectedFile = event.target.value;
    fetch(`/gml-files/${selectedFile}`)
        .then(response => response.text())
        .then(gmlText => {
            graph.loadFromGML(gmlText, selectedFile);
            solver.solve(gmlText);
        });
});

document.getElementById('restartButton').addEventListener('click', function () {
    if (graph.currentLevel) {
        fetch(`/gml-files/${graph.currentLevel}`)
            .then(response => response.text())
            .then(gmlText => {
                graph.loadFromGML(gmlText, graph.currentLevel);
                solver.solve(gmlText);
            });
    }
});

document.getElementById('undoButton').addEventListener('click', function () {
    graph.undo();
});

document.getElementById('solverButton').addEventListener('click', function() {
    if (solver.solution) {
        solver.executeSolution();
    }
});

canvas.addEventListener('mousedown', event => {
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;
    graph.mouseDownTime = new Date().getTime();

    graph.nodes.forEach(node => {
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= graph.nodeRadius) {
            graph.draggingNode = node;
            graph.dragOffsetX = dx;
            graph.dragOffsetY = dy;
        }
    });
});

canvas.addEventListener('mousemove', event => {
    if (graph.draggingNode && !graph.isSucking) {
        graph.draggingNode.x = event.offsetX - graph.dragOffsetX;
        graph.draggingNode.y = event.offsetY - graph.dragOffsetY;
    }
});

canvas.addEventListener('mouseup', event => {
    const mouseUpTime = new Date().getTime();
    const timeElapsed = mouseUpTime - graph.mouseDownTime;

    if (graph.draggingNode) {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        if (timeElapsed <= 300 && !graph.isSucking) {
            const node = graph.draggingNode;
            graph.handleNodeClick(node.id);
        }
        graph.draggingNode = null;
    }
});
// Function to handle dragging with both mouse and touch
function startDrag(event, isTouch = false) {
    const mouseX = isTouch ? event.touches[0].clientX : event.offsetX;
    const mouseY = isTouch ? event.touches[0].clientY : event.offsetY;
    graph.mouseDownTime = new Date().getTime();

    graph.nodes.forEach(node => {
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= graph.nodeRadius) {
            graph.draggingNode = node;
            graph.dragOffsetX = dx;
            graph.dragOffsetY = dy;
        }
    });
}

function moveDrag(event, isTouch = false) {
    const mouseX = isTouch ? event.touches[0].clientX : event.offsetX;
    const mouseY = isTouch ? event.touches[0].clientY : event.offsetY;

    if (graph.draggingNode && !graph.isSucking) {
        graph.draggingNode.x = mouseX - graph.dragOffsetX;
        graph.draggingNode.y = mouseY - graph.dragOffsetY;
    }
}

function endDrag(event) {
    const mouseUpTime = new Date().getTime();
    const timeElapsed = mouseUpTime - graph.mouseDownTime;

    if (graph.draggingNode) {
        const mouseX = event.changedTouches ? event.changedTouches[0].clientX : event.offsetX;
        const mouseY = event.changedTouches ? event.changedTouches[0].clientY : event.offsetY;

        if (timeElapsed <= 300 && !graph.isSucking) {
            const node = graph.draggingNode;
            graph.handleNodeClick(node.id);
        }
        graph.draggingNode = null;
    }
}

// Mouse events
canvas.addEventListener('mousedown', event => startDrag(event));
canvas.addEventListener('mousemove', event => moveDrag(event));
canvas.addEventListener('mouseup', event => endDrag(event));

// Touch events
canvas.addEventListener('touchstart', event => {
    event.preventDefault();  // Prevent scrolling when touching the canvas
    startDrag(event, true);
});

canvas.addEventListener('touchmove', event => {
    event.preventDefault();  // Prevent scrolling when touching the canvas
    moveDrag(event, true);
});

canvas.addEventListener('touchend', event => endDrag(event));