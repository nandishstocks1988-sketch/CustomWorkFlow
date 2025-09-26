/* ==========================================================================
   Diagram - Mermaid Diagram Generation
   ========================================================================== */

// Add render scheduling to prevent excessive updates
window.scheduleRender = (function () {
    let timeout = null;
    return function () {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (typeof window.generateMermaid === 'function') {
                window.generateMermaid();
            }
        }, 150);
    };
})();

window.buildEdgeOperator = function (c) {
    const def = window.EDGE_STYLE_DEFS[c.type] || window.EDGE_STYLE_DEFS.solid;
    const arrowWanted = def.forceNoArrow ? false : (c.arrow !== false);
    return arrowWanted ? def.arrowOp : def.noArrowOp;
};

window.emitSystemForMermaid = function (lines, sysName, subgroupMap) {
    const cfg = window.systems[sysName]; if (!cfg) return;
    const baseId = window.sanitizeId(sysName);
    lines.push(`%% SYSTEM START: ${baseId}`);
    lines.push(`subgraph ${baseId}["${window.esc(sysName)}"]`);
    lines.push(cfg.layout === "horizontal" ? "direction LR" : "direction TB");

    const entries = Object.entries(subgroupMap || {});
    if (entries.length) {
        entries.forEach(([sg, items]) => {
            if (!items.length) return;
            if (sg === "__nogroup") {
                items.forEach(nl => lines.push(nl));
            } else {
                const sgId = window.sanitizeId(sysName + "_" + sg);
                const sgCfg = cfg.subgroups[sg] || { layout: "vertical", fill: "#eef5ff", stroke: "#9dbce6" };
                lines.push(`subgraph ${sgId}["${window.esc(sg)}"]`);
                lines.push(sgCfg.layout === "horizontal" ? "direction LR" : "direction TB");
                items.forEach(nl => lines.push(nl));
                lines.push("end");
            }
        });
    }

    lines.push("end");
    lines.push(`%% SYSTEM END: ${baseId}`);
    lines.push("");
};

// Helper function to build Mermaid source without triggering full generateMermaid
window.buildMermaidSource = function () {
    if (typeof window.migrateLegacyPlacementIfNeeded === 'function') {
        window.migrateLegacyPlacementIfNeeded();
    }

    const systemGroups = {};
    if (window.nodes) {
        window.nodes.forEach(n => {
            const line = `${n.id}${window.shapeWrap(n.shape || "rect", `"${window.esc(n.label || n.id)}"`)}`;
            if (n.system && window.systems[n.system]) {
                const sg = n.subgroup || "__nogroup";
                if (!systemGroups[n.system]) systemGroups[n.system] = {};
                if (!systemGroups[n.system][sg]) systemGroups[n.system][sg] = [];
                systemGroups[n.system][sg].push(line);
            }
        });
    }

    const dir = window.systemsArrangement === "horizontal" ? "LR" : "TD";
    const lines = [];
    lines.push(`graph ${dir}`);
    lines.push("");

    window.systemsOrder.forEach(sys => {
        window.emitSystemForMermaid(lines, sys, systemGroups[sys] || {});
    });

    // User edges and styles
    const userEdgeLines = [];
    const nodeStyleLines = [];
    const userLinkStyles = [];

    if (window.nodes) {
        window.nodes.forEach(n => {
            nodeStyleLines.push(
                `style ${n.id} fill:${window.sanitizeColor(n.bgColor)},stroke:${window.sanitizeColor(n.outlineColor)},stroke-width:2px,color:${window.sanitizeColor(n.textColor)}`
            );
            if (n.connections) {
                n.connections.forEach(c => {
                    if (!c.source) return;
                    const op = window.buildEdgeOperator(c);
                    const lbl = c.label ? `|${window.esc(c.label)}|` : "";
                    const idx = userEdgeLines.length;
                    userEdgeLines.push(`${c.source} ${op}${lbl} ${n.id}`);

                    if (!window.EDGE_STYLE_SAFE_MODE) {
                        const color = window.sanitizeColor(c.color || "#333333");
                        const width = Math.min(6, Math.max(1, c.width || 2));
                        const def = window.EDGE_STYLE_DEFS[c.type] || window.EDGE_STYLE_DEFS.solid;
                        const parts = [`stroke:${color}`, `stroke-width:${width}px`];
                        if (def.pattern === "dotted") {
                            parts.push("stroke-dasharray:2 4");
                        } else if (def.pattern === "double") {
                            if (width < 4) parts[1] = "stroke-width:4px";
                            parts.push("stroke-dasharray:4 2");
                        }
                        userLinkStyles.push(`linkStyle ${idx} ${parts.join(',')};`);
                    }
                });
            }
        });
    }

    if (userEdgeLines.length) {
        lines.push("");
        lines.push(...userEdgeLines);
    }

    if (nodeStyleLines.length) {
        lines.push("");
        lines.push(...nodeStyleLines);
    }

    // System styling
    Object.keys(window.systems || {}).forEach(sys => {
        const cfg = window.systems[sys];
        const sysId = window.sanitizeId(sys);
        lines.push(`style ${sysId} fill:${window.sanitizeColor(cfg.fill)},stroke:${window.sanitizeColor(cfg.stroke)},stroke-width:2px`);
        Object.entries(cfg.subgroups || {}).forEach(([sg, scfg]) => {
            const sgId = window.sanitizeId(sys + "_" + sg);
            lines.push(`style ${sgId} fill:${window.sanitizeColor(scfg.fill)},stroke:${window.sanitizeColor(scfg.stroke)},stroke-width:2px`);
        });
    });

    if (!window.EDGE_STYLE_SAFE_MODE && userLinkStyles.length) {
        lines.push("");
        lines.push(...userLinkStyles);
    }

    return lines.join("\n");
};

// Sync mxGraph changes back to data model
window.syncMxGraphToModel = function (graph) {
    const model = graph.getModel();
    const parent = graph.getDefaultParent();

    // First, collect and reorder systems based on position
    const systemPositions = [];

    window.systemsOrder.forEach(sysName => {
        const sysId = window.sanitizeId(sysName);
        const sysCell = model.getCell(sysId);

        if (sysCell && sysCell.geometry) {
            systemPositions.push({
                name: sysName,
                x: sysCell.geometry.x,
                y: sysCell.geometry.y,
                width: sysCell.geometry.width,
                height: sysCell.geometry.height
            });

            // Save position
            if (!window.systemPlacement[sysName]) {
                window.systemPlacement[sysName] = {};
            }
            window.systemPlacement[sysName].x = sysCell.geometry.x;
            window.systemPlacement[sysName].y = sysCell.geometry.y;
            window.systemPlacement[sysName].width = sysCell.geometry.width;
            window.systemPlacement[sysName].height = sysCell.geometry.height;
        }
    });

    // Sort systems based on arrangement
    if (window.systemsArrangement === "horizontal") {
        systemPositions.sort((a, b) => a.x - b.x);
    } else {
        systemPositions.sort((a, b) => a.y - b.y);
    }

    // Update system order
    const newOrder = systemPositions.map(sp => sp.name);
    const orderChanged = !window.systemsOrder.every((sys, i) => sys === newOrder[i]);

    if (orderChanged) {
        window.systemsOrder = newOrder;
        window.systemsOrder.forEach((sys, index) => {
            if (window.systemPlacement[sys]) {
                window.systemPlacement[sys].order = index;
            }
        });
        // Rebuild system order for placement
        window.rebuildSystemsOrder();
        window.renderSystemList();
    }

    // Update node parent assignments
    window.nodes.forEach(node => {
        const nodeCell = model.getCell(node.id);
        if (!nodeCell) return;

        const parentCell = nodeCell.getParent();
        const oldSystem = node.system;
        const oldSubgroup = node.subgroup;

        if (parentCell && parentCell !== parent) {
            // Check if parent is a system
            const newSystem = window.systemsOrder.find(sys =>
                window.sanitizeId(sys) === parentCell.id
            );

            if (newSystem) {
                node.system = newSystem;
                node.subgroup = "";
            } else {
                // Check if parent is a subgroup
                const parentSystemCell = parentCell.getParent();
                if (parentSystemCell && parentSystemCell !== parent) {
                    const system = window.systemsOrder.find(sys =>
                        window.sanitizeId(sys) === parentSystemCell.id
                    );

                    if (system) {
                        const sgId = parentCell.id;
                        const sgName = Object.keys(window.systems[system].subgroups || {})
                            .find(sg => window.sanitizeId(system + '_' + sg) === sgId);

                        if (sgName) {
                            node.system = system;
                            node.subgroup = sgName;
                        }
                    }
                }
            }
        } else {
            // Node is at root level
            node.system = "";
            node.subgroup = "";
        }

        // Update UI if system or subgroup changed
        if (node.system !== oldSystem || node.subgroup !== oldSubgroup) {
            const nodeCard = document.querySelector(`.node[data-id="${node.id}"]`);
            if (nodeCard) {
                const sysSelect = nodeCard.querySelector('.system-select');
                const sgSelect = nodeCard.querySelector('.subgroup-select');

                if (sysSelect) {
                    sysSelect.value = node.system;
                }

                if (sgSelect) {
                    if (node.system) {
                        window.populateSubgroups(node.system, sgSelect, node.subgroup);
                    } else {
                        sgSelect.innerHTML = '<option value="">-- Subgroup --</option>';
                    }
                }
            }
        }
    });
};

window.syncEdgeChanges = function (graph) {
    const model = graph.getModel();

    // Clear all existing connections
    window.nodes.forEach(node => {
        node.connections = [];
    });

    // Rebuild connections from mxGraph edges
    const edges = Object.values(model.cells).filter(cell => model.isEdge(cell));

    edges.forEach(edge => {
        if (!edge.source || !edge.target) return;

        const sourceNode = window.nodes.find(n => n.id === edge.source.id);
        const targetNode = window.nodes.find(n => n.id === edge.target.id);

        if (sourceNode && targetNode) {
            // Parse edge style
            const style = edge.style || '';
            const styleObj = {};
            style.split(';').forEach(item => {
                const [key, value] = item.split('=');
                if (key && value) styleObj[key] = value;
            });

            // Determine connection type
            let connType = 'solid';
            if (styleObj.dashed) {
                connType = styleObj.dashPattern === '2 2' ? 'dotted' : 'dashed';
            }

            // Create connection on target node
            const conn = {
                source: sourceNode.id,
                label: edge.value || '',
                type: connType,
                color: styleObj.strokeColor || '#333333',
                width: parseInt(styleObj.strokeWidth) || 2,
                arrow: styleObj.endArrow !== 'none'
            };

            targetNode.connections.push(conn);
        }
    });

    // Update all connection UI
    window.nodes.forEach(node => {
        const nodeCard = document.querySelector(`.node[data-id="${node.id}"]`);
        if (nodeCard) {
            const connContainer = nodeCard.querySelector('.connections-container');
            if (connContainer) {
                connContainer.innerHTML = '';
                node.connections.forEach(c => {
                    connContainer.appendChild(window.buildConnectionRow(node.id, c));
                });
            }
        }
    });
};

window.generateMermaid = function () {
    // Prevent re-entrant calls
    if (window._generatingMermaid) return;
    window._generatingMermaid = true;

    try {
        // Save node state if not importing
        if (!window.isImporting && window.nodes) {
            window.nodes.forEach(n => {
                if (typeof window.saveNode === 'function') {
                    window.saveNode(n.id);
                }
            });
        }

        if (typeof window.migrateLegacyPlacementIfNeeded === 'function') {
            window.migrateLegacyPlacementIfNeeded();
        }

        // Build systemGroups: system -> subgroup -> array of node definition lines
        const systemGroups = {};
        if (window.nodes) {
            window.nodes.forEach(n => {
                const line = `${n.id}${window.shapeWrap(n.shape || "rect", `"${window.esc(n.label || n.id)}"`)}`;
                if (n.system && window.systems[n.system]) {
                    const sg = n.subgroup || "__nogroup";
                    if (!systemGroups[n.system]) systemGroups[n.system] = {};
                    if (!systemGroups[n.system][sg]) systemGroups[n.system][sg] = [];
                    systemGroups[n.system][sg].push(line);
                }
            });
        }

        // Simple arrangement based on system order
        const dir = window.systemsArrangement === "horizontal" ? "LR" : "TD";

        const lines = [];
        lines.push(`graph ${dir}`);
        lines.push("");

        // Emit systems in order
        window.systemsOrder.forEach(sys => {
            window.emitSystemForMermaid(lines, sys, systemGroups[sys] || {});
        });

        // -------- User Edges & Node Styles --------
        const userEdgeLines = [];
        const nodeStyleLines = [];
        const userLinkStyles = [];
        let corruption = false;

        if (window.nodes) {
            window.nodes.forEach(n => {
                nodeStyleLines.push(
                    `style ${n.id} fill:${window.sanitizeColor(n.bgColor)},stroke:${window.sanitizeColor(n.outlineColor)},stroke-width:2px,color:${window.sanitizeColor(n.textColor)}`
                );
                if (n.connections) {
                    n.connections.forEach(c => {
                        if (!c.source) return;
                        const op = window.buildEdgeOperator(c);
                        const lbl = c.label ? `|${window.esc(c.label)}|` : "";
                        const idx = userEdgeLines.length;
                        userEdgeLines.push(`${c.source} ${op}${lbl} ${n.id}`);
                        if (!window.EDGE_STYLE_SAFE_MODE) {
                            const color = window.sanitizeColor(c.color || "#333333");
                            const width = Math.min(6, Math.max(1, c.width || 2));
                            const def = window.EDGE_STYLE_DEFS[c.type] || window.EDGE_STYLE_DEFS.solid;
                            const parts = [`stroke:${color}`, `stroke-width:${width}px`];
                            if (def.pattern === "dotted") {
                                parts.push("stroke-dasharray:2 4");
                            } else if (def.pattern === "double") {
                                if (width < 4) parts[1] = "stroke-width:4px";
                                parts.push("stroke-dasharray:4 2");
                            }
                            let line = `linkStyle ${idx} ${parts.join(',')};`;
                            if (/[^ -~]/.test(line) || !/^#[0-9a-f]{6}$/i.test(color)) {
                                corruption = true;
                            } else userLinkStyles.push(line);
                        }
                    });
                }
            });
        }

        // Append user edges
        if (userEdgeLines.length) {
            lines.push("");
            lines.push(...userEdgeLines);
        }

        // Node style lines
        if (nodeStyleLines.length) {
            lines.push("");
            lines.push(...nodeStyleLines);
        }

        // System + subgroup styling
        Object.keys(window.systems || {}).forEach(sys => {
            const cfg = window.systems[sys];
            const sysId = window.sanitizeId(sys);
            lines.push(`style ${sysId} fill:${window.sanitizeColor(cfg.fill)},stroke:${window.sanitizeColor(cfg.stroke)},stroke-width:2px`);
            Object.entries(cfg.subgroups || {}).forEach(([sg, scfg]) => {
                const sgId = window.sanitizeId(sys + "_" + sg);
                lines.push(`style ${sgId} fill:${window.sanitizeColor(scfg.fill)},stroke:${window.sanitizeColor(scfg.stroke)},stroke-width:2px`);
            });
        });

        // User link styles
        if (!window.EDGE_STYLE_SAFE_MODE && userLinkStyles.length && !corruption) {
            lines.push("");
            lines.push(...userLinkStyles);
        }

        const src = lines.join("\n");
        window.__lastMermaidSrc = src;

        // Reset saved positions when Update Diagram is clicked
        // This ensures mxGraph will layout fresh from the data model
        window.systemsOrder.forEach(sysName => {
            if (window.systemPlacement[sysName]) {
                delete window.systemPlacement[sysName].x;
                delete window.systemPlacement[sysName].y;
                delete window.systemPlacement[sysName].width;
                delete window.systemPlacement[sysName].height;
            }
        });

        // Render both mermaid and mxGraph
        renderMermaidDiagram(src, false); // false = also update mxGraph
        renderMxGraphDiagram();

    } finally {
        window._generatingMermaid = false;
    }
};

function renderMermaidDiagram(src, skipMxGraph = false) {
    const diagramEl = window.$("diagram");
    if (diagramEl) {
        try {
            diagramEl.innerHTML = '<div class="mermaid-container"></div>';
            if (typeof mermaid !== 'undefined' && typeof mermaid.render === 'function') {
                mermaid.render('mermaid-diagram', src)
                    .then(result => {
                        diagramEl.querySelector('.mermaid-container').innerHTML = result.svg;

                        // Only update mxGraph if not skipping
                        if (!skipMxGraph) {
                            const mxContainer = window.$("mxgraph-container");
                            if (mxContainer && mxContainer.innerHTML !== "") {
                                renderMxGraphDiagram();
                            }
                        }
                    })
                    .catch(err => {
                        console.error("Mermaid rendering error:", err);
                        diagramEl.querySelector('.mermaid-container').innerHTML =
                            `<div style="color:red;padding:10px;">Mermaid error: ${err.message}</div>`;
                    });
            }
        } catch (err) {
            console.error("Mermaid error:", err);
            diagramEl.innerHTML = `<div style="color:red;padding:10px;">Mermaid error: ${err.message}</div>`;
        }
    }
}

function renderMxGraphDiagram() {
    const mxContainer = window.$("mxgraph-container");
    if (!mxContainer) return;

    try {
        if (window.mxClient && typeof window.mxClient.isBrowserSupported === 'function') {
            mxContainer.innerHTML = "";

            // Set container styles to match diagram preview
            mxContainer.style.position = 'relative';
            mxContainer.style.overflow = 'auto';
            mxContainer.style.backgroundColor = window.$("diagramBgColor")?.value || '#ffffff';

            if (typeof mxGraph !== 'function') {
                console.error("mxGraph is not defined.");
                return;
            }

            // Create the graph instance with full drag-drop support
            const graph = window.initializeMxGraph(mxContainer);
            if (!graph) return;

            // Enable automatic updates with synchronization
            setupMxGraphEventHandlers(graph);

            const parent = graph.getDefaultParent();
            graph.getModel().beginUpdate();

            const systemCells = {};
            const nodeCells = {};

            try {
                // Add systems with better positioning matching mermaid layout
                let currentX = 50;
                let currentY = 50;
                const SYSTEM_H_SPACING = 40;
                const SYSTEM_V_SPACING = 40;
                const MIN_SYSTEM_WIDTH = 220;
                const MIN_SYSTEM_HEIGHT = 150;

                // First pass: calculate all system sizes
                const systemSizes = {};
                window.systemsOrder.forEach(sysName => {
                    if (!window.systems[sysName]) return;

                    const nodeCount = window.nodes.filter(n => n.system === sysName).length;
                    const subgroupCount = Object.keys(window.systems[sysName].subgroups || {}).length;

                    // Calculate dimensions based on content
                    let width = MIN_SYSTEM_WIDTH;
                    let height = MIN_SYSTEM_HEIGHT;

                    if (nodeCount > 0) {
                        const cols = Math.ceil(Math.sqrt(nodeCount));
                        const rows = Math.ceil(nodeCount / cols);
                        width = Math.max(MIN_SYSTEM_WIDTH, cols * 90 + 60);
                        height = Math.max(MIN_SYSTEM_HEIGHT, rows * 60 + 80 + 25);

                        // Add extra height for subgroups
                        if (subgroupCount > 0) {
                            height += subgroupCount * 100;
                        }
                    }

                    systemSizes[sysName] = { width, height };
                });

                // Second pass: position systems
                window.systemsOrder.forEach((sysName, index) => {
                    if (!window.systems[sysName]) return;

                    const system = window.systems[sysName];
                    const { width, height } = systemSizes[sysName];

                    // Check if we have saved positions
                    if (window.systemPlacement[sysName] &&
                        window.systemPlacement[sysName].x !== undefined &&
                        window.systemPlacement[sysName].y !== undefined) {
                        // Use saved positions
                        currentX = window.systemPlacement[sysName].x;
                        currentY = window.systemPlacement[sysName].y;
                    } else {
                        // Calculate position based on arrangement
                        if (window.systemsArrangement === "horizontal") {
                            // For horizontal layout, place systems side by side
                            if (index > 0) {
                                const prevSystem = window.systemsOrder[index - 1];
                                if (systemSizes[prevSystem]) {
                                    currentX += systemSizes[prevSystem].width + SYSTEM_H_SPACING;
                                }
                            }
                        } else {
                            // For vertical layout, stack systems
                            if (index > 0) {
                                const prevSystem = window.systemsOrder[index - 1];
                                if (systemSizes[prevSystem]) {
                                    currentY += systemSizes[prevSystem].height + SYSTEM_V_SPACING;
                                }
                            }
                        }
                    }

                    // Create system vertex with consistent styling
                    const v = graph.insertVertex(
                        parent,
                        window.sanitizeId(sysName),
                        sysName,
                        currentX, currentY, width, height,
                        `fillColor=${system.fill};strokeColor=${system.stroke};strokeWidth=2;` +
                        `rounded=1;fontSize=14;fontStyle=1;` +
                        `verticalAlign=top;labelPosition=center;align=center;` +
                        `spacingTop=10;spacingLeft=0;spacingRight=0;` +
                        `resizable=1;movable=1;container=1;foldable=0;`
                    );

                    systemCells[sysName] = v;
                });

                // Group nodes by system and subgroup
                const nodesBySystem = {};
                if (window.nodes) {
                    window.nodes.forEach(n => {
                        if (n.system && systemCells[n.system]) {
                            if (!nodesBySystem[n.system]) nodesBySystem[n.system] = {};
                            const sg = n.subgroup || '__nogroup';
                            if (!nodesBySystem[n.system][sg]) nodesBySystem[n.system][sg] = [];
                            nodesBySystem[n.system][sg].push(n);
                        }
                    });
                }

                // Add nodes within their systems/subgroups
                Object.entries(nodesBySystem).forEach(([sysName, subgroups]) => {
                    const systemCell = systemCells[sysName];
                    let currentSubgroupY = 40;

                    Object.entries(subgroups).forEach(([sgName, sysNodes]) => {
                        let parentCell = systemCell;

                        // Create subgroup if needed
                        if (sgName !== '__nogroup' && window.systems[sysName].subgroups[sgName]) {
                            const sg = window.systems[sysName].subgroups[sgName];
                            const sgNodeCount = sysNodes.length;
                            const sgCols = Math.ceil(Math.sqrt(sgNodeCount));
                            const sgRows = Math.ceil(sgNodeCount / sgCols);
                            const sgWidth = Math.max(150, sgCols * 80 + 20);
                            const sgHeight = Math.max(80, sgRows * 50 + 40);

                            parentCell = graph.insertVertex(
                                systemCell,
                                window.sanitizeId(sysName + '_' + sgName),
                                sgName,
                                20, currentSubgroupY, sgWidth, sgHeight,
                                `fillColor=${sg.fill};strokeColor=${sg.stroke};strokeWidth=1;` +
                                `rounded=1;fontSize=12;` +
                                `verticalAlign=top;labelPosition=center;align=center;` +
                                `spacingTop=8;` +
                                `resizable=1;movable=1;container=1;foldable=0;`
                            );
                            currentSubgroupY += sgHeight + 20;
                        }

                        // Position nodes in grid
                        const cellsPerRow = Math.ceil(Math.sqrt(sysNodes.length));
                        const cellWidth = 70;
                        const cellHeight = 40;
                        const padding = 15;
                        const startX = sgName === '__nogroup' ? 20 : 15;
                        const startY = sgName === '__nogroup' ? currentSubgroupY + 35 : 35;

                        sysNodes.forEach((n, idx) => {
                            const row = Math.floor(idx / cellsPerRow);
                            const col = idx % cellsPerRow;
                            const x = startX + (col * (cellWidth + padding));
                            const y = startY + (row * (cellHeight + padding));

                            let shapeStyle = '';
                            switch (n.shape) {
                                case 'circle': shapeStyle = 'ellipse;'; break;
                                case 'diamond': shapeStyle = 'rhombus;'; break;
                                case 'cylinder': shapeStyle = 'shape=cylinder;'; break;
                                case 'stadium':
                                case 'round': shapeStyle = 'rounded=1;'; break;
                                default: shapeStyle = 'rounded=0;';
                            }

                            const style = shapeStyle +
                                `fillColor=${n.bgColor};strokeColor=${n.outlineColor};` +
                                `fontColor=${n.textColor};fontSize=11;align=center;` +
                                `verticalAlign=middle;whiteSpace=wrap;html=1;` +
                                `resizable=1;movable=1;`;

                            const v = graph.insertVertex(
                                parentCell,
                                n.id,
                                n.label || n.id,
                                x, y, cellWidth, cellHeight,
                                style
                            );
                            nodeCells[n.id] = v;
                        });

                        if (sgName === '__nogroup') {
                            currentSubgroupY += Math.ceil(sysNodes.length / cellsPerRow) * (cellHeight + padding) + 20;
                        }
                    });
                });

                // Add edges with proper styling
                if (window.nodes) {
                    window.nodes.forEach(n => {
                        if (!nodeCells[n.id]) return;
                        if (n.connections) {
                            n.connections.forEach(conn => {
                                if (!conn.source || !nodeCells[conn.source]) return;

                                let edgeStyle = `edgeStyle=orthogonalEdgeStyle;curved=1;` +
                                    `strokeColor=${conn.color || '#333333'};` +
                                    `strokeWidth=${conn.width || 2};`;

                                // Add line style
                                if (conn.type === 'dashed' || conn.type === 'dashedNo') {
                                    edgeStyle += 'dashed=1;dashPattern=5 5;';
                                } else if (conn.type === 'dotted' || conn.type === 'dottedNo') {
                                    edgeStyle += 'dashed=1;dashPattern=2 2;';
                                }

                                // Handle arrow
                                if (!conn.arrow || conn.type.endsWith('No')) {
                                    edgeStyle += 'endArrow=none;';
                                } else {
                                    edgeStyle += 'endArrow=classic;';
                                }

                                graph.insertEdge(
                                    parent,
                                    null,
                                    conn.label || '',
                                    nodeCells[conn.source],
                                    nodeCells[n.id],
                                    edgeStyle + 'movable=1;resizable=1;'
                                );
                            });
                        }
                    });
                }

            } finally {
                graph.getModel().endUpdate();

                // Update group bounds to fit content
                Object.values(systemCells).forEach(cell => {
                    graph.updateGroupBounds([cell], 20, true);
                });

                // Fit the graph with some padding
                graph.fit(30);

                // Apply a reasonable zoom
                const scale = graph.view.scale;
                if (scale > 1.5) {
                    graph.zoomTo(1.2);
                } else if (scale < 0.3) {
                    graph.zoomTo(0.5);
                }
            }

            window.interactiveGraph = graph;
        }
    } catch (e) {
        mxContainer.innerHTML = `<div style="color:red;padding:10px;">mxGraph error: ${e.message}</div>`;
        console.error("mxGraph error:", e);
    }
}

function setupMxGraphEventHandlers(graph) {
    let syncTimeout = null;
    const model = graph.getModel();

    function scheduleMermaidUpdate() {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            // Sync changes from mxGraph to model
            window.syncMxGraphToModel(graph);
            window.syncEdgeChanges(graph);

            // Update Mermaid diagram only (not mxGraph)
            const src = window.buildMermaidSource();
            if (src) {
                renderMermaidDiagram(src, true); // true = skip mxGraph update
            }

            // Update all dropdowns
            if (typeof window.updateSystemDropdowns === 'function') {
                window.updateSystemDropdowns();
            }
            if (typeof window.updateConnectDropdowns === 'function') {
                window.updateConnectDropdowns();
            }
        }, 300);
    }

    // Handle all movement and changes
    graph.addListener(mxEvent.CELLS_MOVED, () => scheduleMermaidUpdate());
    graph.addListener(mxEvent.CELLS_RESIZED, () => scheduleMermaidUpdate());
    graph.addListener(mxEvent.CELL_CONNECTED, () => scheduleMermaidUpdate());
    graph.addListener(mxEvent.CELLS_REMOVED, () => scheduleMermaidUpdate());
    graph.addListener(mxEvent.CELLS_ADDED, () => scheduleMermaidUpdate());

    // Handle label changes (system/node renaming)
    graph.addListener(mxEvent.LABEL_CHANGED, function (sender, evt) {
        const cell = evt.getProperty('cell');
        const newValue = evt.getProperty('value');
        const oldValue = evt.getProperty('old');

        // Check if it's a system
        const oldSystemName = window.systemsOrder.find(sys =>
            window.sanitizeId(sys) === cell.id
        );

        if (oldSystemName) {
            // System rename
            if (newValue && newValue !== oldSystemName) {
                const result = window.renameSystem(oldSystemName, newValue);
                if (result.ok) {
                    // Update cell ID to match new sanitized name
                    cell.id = window.sanitizeId(newValue);
                    window.renderSystemList();
                    window.updateSystemDropdowns();
                    scheduleMermaidUpdate();
                } else {
                    // Revert on error
                    model.setValue(cell, oldSystemName);
                    alert(result.error);
                }
            }
        } else {
            // Check if it's a node
            const node = window.nodes.find(n => n.id === cell.id);
            if (node) {
                node.label = newValue || '';

                // Update node card
                const nodeCard = document.querySelector(`.node[data-id="${cell.id}"]`);
                if (nodeCard) {
                    const nameInput = nodeCard.querySelector('.node-name-input');
                    if (nameInput) nameInput.value = newValue || '';
                }

                scheduleMermaidUpdate();
            }
        }
    });
}
// Fix for Mermaid diagram node alignment
document.addEventListener('DOMContentLoaded', function () {
    // Override Mermaid's default spacing
    if (window.mermaid && window.mermaid.initialize) {
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'loose',
            flowchart: {
                htmlLabels: true,
                nodeSpacing: 50,
                rankSpacing: 50,
                curve: 'basis',
                padding: 20,
                useMaxWidth: true
            },
            theme: 'default',
            themeVariables: {
                primaryColor: '#6366f1',
                primaryTextColor: '#000',
                primaryBorderColor: '#4f46e5',
                lineColor: '#333',
                secondaryColor: '#e0e7ff',
                tertiaryColor: '#f3f4f6',
                background: '#ffffff',
                mainBkg: '#ffffff',
                secondBkg: '#f3f4f6',
                tertiaryBkg: '#e5e7eb'
            }
        });
    }
});
// Initialize diagram functionality
document.addEventListener("DOMContentLoaded", function () {
    // Add safety check for bindClick
    if (typeof window.bindClick === 'function') {
        window.bindClick("showPreviewBtn", window.generateMermaid);
        window.bindClick("generateBtn", window.generateMermaid);
    } else {
        // Fallback with timeout
        setTimeout(() => {
            if (typeof window.bindClick === 'function') {
                window.bindClick("showPreviewBtn", window.generateMermaid);
                window.bindClick("generateBtn", window.generateMermaid);
            }
        }, 100);
    }
});