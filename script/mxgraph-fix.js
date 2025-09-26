/* ==========================================================================
   MxGraph Fix - Initialization helper with full drag-drop support
   ========================================================================== */

// Global override of mxGraph images after mxClient loads
if (window.mxClient) {
    const emptyImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // Override all image constants
    mxClient.imageBasePath = '';

    // Override mxGraph prototype images
    if (window.mxGraph && window.mxGraph.prototype) {
        mxGraph.prototype.collapsedImage = new mxImage(emptyImage, 1, 1);
        mxGraph.prototype.expandedImage = new mxImage(emptyImage, 1, 1);
        mxGraph.prototype.warningImage = new mxImage(emptyImage, 1, 1);
    }

    // Override mxConstants images
    if (window.mxConstants) {
        mxConstants.COLLAPSE_IMAGE = emptyImage;
        mxConstants.EXPAND_IMAGE = emptyImage;
        mxConstants.WARNING_IMAGE = emptyImage;
    }
}

window.initializeMxGraph = function (container) {
    if (!window.mxClient || !window.mxClient.isBrowserSupported()) {
        console.error("mxGraph not supported in this browser");
        return null;
    }

    // Creates the graph inside the given container
    const graph = new mxGraph(container);

    // Enable drag and drop
    graph.setDropEnabled(true);
    graph.setSplitEnabled(false);

    // Enable moving of all cells (systems, nodes, edges)
    graph.setCellsMovable(true);
    graph.setCellsResizable(true);
    graph.setConnectable(true);
    graph.setCellsEditable(true);
    graph.setAllowDanglingEdges(false);

    // Enable selection
    graph.setCellsSelectable(true);
    graph.setMultigraph(false);

    // Configure drag preview
    graph.graphHandler.htmlPreview = true;
    graph.graphHandler.guidesEnabled = true;

    // Enable moving of edge labels
    graph.edgeLabelsMovable = true;

    // Enable constraints for better alignment
    graph.setConstrainChildren(true);
    graph.setExtendParents(true);
    graph.setExtendParentsOnAdd(true);

    // Custom validation for connections
    graph.getEdgeValidationError = function (edge, source, target) {
        if (source == null || target == null) {
            return 'Connection must have source and target';
        }
        return null;
    };

    // Enable better group/container behavior
    graph.setRecursiveResize(true);
    graph.setConstrainChildren(false);
    graph.setExtendParents(true);
    graph.setExtendParentsOnAdd(true);

    // Override to allow dropping into groups
    graph.isValidDropTarget = function (cell, cells, evt) {
        return cell != null &&
            (this.model.isVertex(cell) || this.model.isEdge(cell)) &&
            !this.model.isEdge(this.model.getParent(cell));
    };

    // Enable group resize
    graph.isExtendParent = function (cell) {
        return this.model.isVertex(cell) && this.model.getChildCount(cell) > 0;
    };

    // Completely disable folding
    graph.foldingEnabled = false;
    graph.collapseToPreferredSize = false;

    // Override all folding-related methods
    graph.isCellFoldable = function () { return false; };
    graph.foldCells = function () { return null; };

    // Remove fold control
    graph.cellRenderer.createControl = function (state) {
        // Don't create any controls
        return null;
    };

    // Override the image creation in cell renderer
    const originalRedrawControl = mxCellRenderer.prototype.redrawControl;
    mxCellRenderer.prototype.redrawControl = function (state) {
        // Skip control rendering entirely
        if (state && state.cell && graph.model.isVertex(state.cell)) {
            return;
        }
        return originalRedrawControl.apply(this, arguments);
    };

    // Enable panning with right mouse button
    graph.setPanning(true);
    graph.panningHandler.useLeftButtonForPanning = false;
    graph.panningHandler.ignoreCell = true;

    // Enable mouse wheel zoom
    mxEvent.addMouseWheelListener(function (evt, up) {
        if (up) {
            graph.zoomIn();
        } else {
            graph.zoomOut();
        }
        mxEvent.consume(evt);
    });

    // Enable rubberband selection
    new mxRubberband(graph);

    // Configure connection style
    const style = graph.getStylesheet().getDefaultEdgeStyle();
    style[mxConstants.STYLE_ROUNDED] = true;
    style[mxConstants.STYLE_STROKECOLOR] = '#333333';
    style[mxConstants.STYLE_FONTCOLOR] = '#333333';
    style[mxConstants.STYLE_STROKEWIDTH] = 2;
    style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;

    // Configure container/group styles specifically
    const groupStyle = graph.getStylesheet().getCellStyle('group');
    groupStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
    groupStyle[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_TOP;
    groupStyle[mxConstants.STYLE_LABEL_POSITION] = mxConstants.ALIGN_CENTER;



    // Configure the default vertex styles
    const vertexStyle = graph.getStylesheet().getDefaultVertexStyle();
    vertexStyle[mxConstants.STYLE_ROUNDED] = true;
    vertexStyle[mxConstants.STYLE_FONTCOLOR] = '#333333';
    vertexStyle[mxConstants.STYLE_FILLCOLOR] = '#ffffff';
    vertexStyle[mxConstants.STYLE_STROKECOLOR] = '#333333';
    vertexStyle[mxConstants.STYLE_STROKEWIDTH] = 2;
    vertexStyle[mxConstants.STYLE_FONTSIZE] = 11;
    vertexStyle[mxConstants.STYLE_FOLDABLE] = 0;

    // Custom drag and drop handling
    const dropHandler = function (graph, evt, cell, x, y) {
        const parent = graph.getDefaultParent();
        const model = graph.getModel();

        model.beginUpdate();
        try {
            // Handle drop logic here if needed
        } finally {
            model.endUpdate();
        }
    };

    // Install custom drop handler
    const oldDrop = graph.isValidDropTarget;
    graph.isValidDropTarget = function (cell) {
        // Allow dropping on vertices (systems/groups) but not on edges
        return cell != null && this.model.isVertex(cell);
    };

    // Disable context menu
    mxEvent.disableContextMenu(container);

    // Add connection handler for interactive edge creation
    graph.connectionHandler.connectImage = new mxImage(
        'data:image/gif;base64,R0lGODlhEAAQAIAAAP///wAAACH5BAEAAAAALAAAAAAQABAAAAIdhI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuUQAAOw==',
        16, 16
    );

    return graph;
};