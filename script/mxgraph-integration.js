/* ==========================================================================
   MxGraph Integration - System Flow Designer
   ========================================================================== */

window.initializeMxGraph = function (container) {
    if (!window.mxClient || !window.mxClient.isBrowserSupported()) {
        console.error("mxGraph not supported in this browser");
        return null;
    }

    // Disables the built-in context menu
    mxEvent.disableContextMenu(container);

    // Creates the graph inside the given container
    const graph = new mxGraph(container);

    // Configuration
    graph.setConnectable(true);
    graph.setCellsEditable(true);
    graph.setCellsResizable(true);
    graph.setAllowDanglingEdges(false);
    graph.setCellsMovable(true);
    graph.setHtmlLabels(true);
    graph.setDropEnabled(true);
    graph.setPanning(true);
    graph.panningHandler.useLeftButtonForPanning = true;

    // Enable rubberband selection
    new mxRubberband(graph);

    // Adds all required styles to the graph
    const style = graph.getStylesheet().getDefaultVertexStyle();
    style[mxConstants.STYLE_ROUNDED] = true;
    style[mxConstants.STYLE_FONTCOLOR] = '#333333';
    style[mxConstants.STYLE_FILLCOLOR] = '#ffffff';
    style[mxConstants.STYLE_STROKECOLOR] = '#333333';
    style[mxConstants.STYLE_STROKEWIDTH] = 2;

    // Enables automatic sizing of vertices after editing
    graph.setAutoSizeCells(true);

    // Changes the default vertex style in-place
    let edgeStyle = graph.getStylesheet().getDefaultEdgeStyle();
    edgeStyle[mxConstants.STYLE_ROUNDED] = true;
    edgeStyle[mxConstants.STYLE_STROKECOLOR] = '#333333';
    edgeStyle[mxConstants.STYLE_FONTCOLOR] = '#333333';
    edgeStyle[mxConstants.STYLE_STROKEWIDTH] = 2;

    // Enables tooltips
    graph.setTooltips(true);

    // Make containers resizable
    graph.isCellFoldable = function (cell) {
        return this.getModel().getChildCount(cell) > 0;
    };

    return graph;
};

window.renderMxGraph = function (mxContainer) {
    if (!mxContainer) return;

    try {
        mxContainer.innerHTML = "";

        // Create the graph instance
        const graph = window.initializeMxGraph(mxContainer);
        if (!graph) return;

        // Get the default parent for inserting cells
        const parent = graph.getDefaultParent();

        // Begin update transaction
        graph.getModel().beginUpdate();

        // Define system cells map
        const systemCells = {};
        const nodeCells = {};

        try {
            // Add systems as containers with more reasonable initial sizes
            Object.keys(window.systems || {}).forEach((sysName, index) => {
                const system = window.systems[sysName];
                // Start with a smaller default size - will resize to fit content later
                const v = graph.insertVertex(
                    parent,
                    window.sanitizeId(sysName),
                    sysName,
                    30 + (index * 40), 30 + (index * 15), 180, 120,
                    `fillColor=${system.fill};strokeColor=${system.stroke};strokeWidth=2;rounded=1;`
                );
                systemCells[sysName] = v;
            });

            // Group nodes by system for better positioning
            const nodesBySystem = {};
            if (window.nodes) {
                window.nodes.forEach(n => {
                    if (n.system && systemCells[n.system]) {
                        if (!nodesBySystem[n.system]) nodesBySystem[n.system] = [];
                        nodesBySystem[n.system].push(n);
                    }
                });
            }

            // Position nodes in a grid within each system with better spacing
            Object.entries(nodesBySystem).forEach(([sysName, sysNodes]) => {
                // Calculate grid dimensions based on node count
                const nodeCount = sysNodes.length;
                let cellsPerRow = Math.ceil(Math.sqrt(nodeCount));

                // Make grid more rectangular than square for better system container fit
                if (cellsPerRow > 2 && nodeCount <= 6) {
                    cellsPerRow = 2; // Force 2 columns for small sets
                }

                // Adjust node size based on the number of nodes
                let cellWidth = nodeCount <= 4 ? 100 : 80;
                let cellHeight = nodeCount <= 4 ? 50 : 40;
                const padding = 15;

                sysNodes.forEach((n, idx) => {
                    const row = Math.floor(idx / cellsPerRow);
                    const col = idx % cellsPerRow;
                    const x = padding + (col * (cellWidth + padding));
                    const y = padding + (row * (cellHeight + padding));

                    // Determine shape style based on node.shape
                    let shapeStyle;
                    switch (n.shape) {
                        case 'circle': shapeStyle = 'ellipse'; break;
                        case 'diamond': shapeStyle = 'rhombus'; break;
                        case 'stadium': shapeStyle = 'rounded=1'; break;
                        case 'round': shapeStyle = 'rounded=1'; break;
                        case 'cylinder': shapeStyle = 'cylinder=1'; break;
                        default: shapeStyle = '';
                    }

                    const style = `shape=${shapeStyle || 'rectangle'};fillColor=${n.bgColor};strokeColor=${n.outlineColor};fontColor=${n.textColor};`;
                    const v = graph.insertVertex(
                        systemCells[n.system],
                        n.id,
                        n.label || n.id,
                        x, y, cellWidth, cellHeight,
                        style
                    );
                    nodeCells[n.id] = v;
                });
            });

            // Add edges between nodes
            if (window.nodes) {
                window.nodes.forEach(n => {
                    if (!nodeCells[n.id]) return;

                    if (n.connections) {
                        n.connections.forEach(conn => {
                            if (!conn.source || !nodeCells[conn.source]) return;

                            let edgeStyle = `strokeColor=${conn.color || '#333333'};strokeWidth=${conn.width || 2};`;

                            // Add edge styling based on connection type
                            if (conn.type === 'dashed' || conn.type === 'dashedNo') {
                                edgeStyle += 'dashed=1;';
                            } else if (conn.type === 'dotted' || conn.type === 'dottedNo') {
                                edgeStyle += 'dashed=1;dashPattern=1 2;';
                            } else if (conn.type === 'thick' || conn.type === 'thickNo') {
                                edgeStyle += 'strokeWidth=4;';
                            }

                            // Handle arrow visibility
                            if (!conn.arrow) {
                                edgeStyle += 'endArrow=none;';
                            }

                            graph.insertEdge(
                                parent,
                                null,
                                conn.label || '',
                                nodeCells[conn.source],
                                nodeCells[n.id],
                                edgeStyle
                            );
                        });
                    }
                });
            }
        } finally {
            graph.getModel().endUpdate();

            // Resize all system cells to fit their contents with padding
            graph.getModel().beginUpdate();
            try {
                Object.values(systemCells).forEach(cell => {
                    // Use smaller padding for better alignment with mermaid diagram
                    graph.updateGroupBounds([cell], 20);
                });
            } finally {
                graph.getModel().endUpdate();
            }

            // Apply layout algorithm for empty systems
            Object.entries(systemCells).forEach(([sysName, cell]) => {
                if (graph.getModel().getChildCount(cell) === 0) {
                    // Resize empty systems to a smaller size
                    graph.getModel().setGeometry(cell, new mxGeometry(
                        cell.geometry.x, cell.geometry.y, 120, 60
                    ));
                }
            });

            // Final layout adjustment - fit the graph
            graph.fit();

            // Store the graph instance for later reference
            window.interactiveGraph = graph;
        }
    } catch (e) {
        mxContainer.innerHTML = `<div style="color:red;padding:10px;">mxGraph error: ${e.message}</div>`;
        console.error("mxGraph error:", e);
    }
};

