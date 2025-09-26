/* ==========================================================================
   Core - Utilities and State Management
   ========================================================================== */

// Global state
window.nodes = window.nodes || [];
window.nodeCount = window.nodeCount || 0;
window.systems = window.systems || {};
window.systemsOrder = window.systemsOrder || [];
window.systemsArrangement = window.systemsArrangement || "vertical";
window.diagramLegend = window.diagramLegend || "";
window.legendOverlayVisible = window.legendOverlayVisible !== false;
window.isImporting = window.isImporting || false;
window.systemPlacement = window.systemPlacement || {};
window.refreshDiagrams = function () {
    if (typeof window.generateMermaid === 'function') {
        window.generateMermaid();
    }
};

// Constants
window.LANE_HEIGHT = 140;
window.TILE_WIDTH = 180;
window.TILE_H_MARGIN = 40;
window.TILE_Y_OFFSET = 10;
window.ENABLE_ORDER_LOCK = true; // <-- Toggle ordering enforcement (invisible)

// Edge style flags
window.EDGE_STYLE_SAFE_MODE = false;
window.FORCE_SKIP_LINKSTYLE_IF_CORRUPT = true;

// Edge style definitions
window.EDGE_STYLE_DEFS = {
    solid: { arrowOp: "-->", noArrowOp: "---", pattern: "solid" },
    plain: { arrowOp: "-->", noArrowOp: "---", pattern: "solid", forceNoArrow: true },
    dashed: { arrowOp: "-.->", noArrowOp: "-.-", pattern: "dashed" },
    dashedNo: { arrowOp: "-.->", noArrowOp: "-.-", pattern: "dashed", forceNoArrow: true },
    dotted: { arrowOp: "-->", noArrowOp: "---", pattern: "dotted" },
    dottedNo: { arrowOp: "-->", noArrowOp: "---", pattern: "dotted", forceNoArrow: true },
    thick: { arrowOp: "==>", noArrowOp: "===", pattern: "solid" },
    thickNo: { arrowOp: "==>", noArrowOp: "===", pattern: "solid", forceNoArrow: true },
    double: { arrowOp: "==>", noArrowOp: "===", pattern: "double" },
    none: { arrowOp: "---", noArrowOp: "---", pattern: "solid", forceNoArrow: true }
};

// Utility functions
window.$ = function (id) { return document.getElementById(id); };
window.$$ = function (sel) { return Array.from(document.querySelectorAll(sel)); };
window.esc = function (s) { return (s || "").replace(/"/g, "'").replace(/</g, "&lt;"); };
window.sanitizeId = function (str) { return String(str || "").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, ""); };
window.asciiStrict = function (str) {
    return [...String(str || "")].filter(ch => {
        const c = ch.charCodeAt(0);
        return c >= 32 && c <= 126;
    }).join("");
};
window.sanitizeColor = function (raw) {
    if (!raw) return "#333333";
    let s = String(raw)
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .replace(/[°·•∙●▪▫○◦￿¶ß]/g, '#')
        .trim();
    if (!s.startsWith('#') && /^[0-9a-fA-F]{6}$/.test(s)) s = '#' + s;
    s = s.replace(/[^#0-9a-fA-F]/g, "");
    if (!s.startsWith('#')) s = '#' + s;
    let core = s.slice(1).match(/[0-9a-fA-F]{1,6}/); core = core ? core[0] : "";
    while (core.length < 6) core += (core.slice(-1) || '3');
    const out = '#' + core.slice(0, 6).toLowerCase();
    return /^#[0-9a-f]{6}$/.test(out) ? out : "#333333";
};
window.shapeWrap = function (shape, label) {
    switch (shape) {
        case "circle": return `((${label}))`;
        case "diamond": return `{${label}}`;
        case "subroutine": return `[[${label}]]`;
        case "stadium": return `([${label}])`;
        case "round": return `(${label})`;
        case "cylinder": return `(${label})`;
        default: return `[${label}]`;
    }
};
window.bindClick = function (id, fn) {
    const el = window.$(id);
    if (el) el.addEventListener("click", fn);
};

// Initialize mermaid when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    try {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', flowchart: { htmlLabels: false } });
    } catch (e) {
        console.error("Mermaid initialization error:", e);
    }
});