/* ==========================================================================
   Legend Module - Legend editor functionality
   ========================================================================== */

window.renderLegendOverlay = function () {
    const overlay = window.$("legendOverlay");
    const content = window.$("legendOverlayContent");
    if (!overlay || !content) return;
    if (!window.diagramLegend || !window.legendOverlayVisible) {
        overlay.classList.add("hidden");
        return;
    }
    content.innerHTML = window.diagramLegend;
    overlay.classList.remove("hidden");
};

window.syncLegend = function () {
    const editor = window.$("legendEditor");
    window.diagramLegend = editor ? editor.innerHTML.trim() : "";
    window.renderLegendOverlay();
};

window.wireLegendEditor = function () {
    const editor = window.$("legendEditor");
    if (!editor) return;
    window.$$(".color-btn").forEach(btn => {
        btn.addEventListener("click", () => window.applyTextColor(btn.dataset.color));
    });
    window.bindClick("addSwatchBtn", () => {
        const span = document.createElement("span");
        span.textContent = "LABEL";
        span.style.cssText = "background:#4a90e2;color:#fff;padding:2px 6px;border-radius:4px;margin-right:4px;";
        window.insertAtCaret(editor, span); window.syncLegend();
    });
    window.bindClick("clearLegendBtn", () => {
        if (!editor.innerHTML.trim()) return;
        if (confirm("Clear legend content?")) {
            editor.innerHTML = ""; window.syncLegend();
        }
    });
    window.bindClick("toggleLegendOverlayBtn", () => {
        window.legendOverlayVisible = !window.legendOverlayVisible; window.renderLegendOverlay();
    });
    window.bindClick("hideLegendOverlayBtn", () => {
        window.legendOverlayVisible = false; window.renderLegendOverlay();
    });
    window.bindClick("applyLegendTextColorBtn", () => {
        window.applyTextColor(window.$("legendTextColorPicker")?.value || "#222");
    });
    window.bindClick("applyLegendBgColorBtn", () => {
        window.applyHighlightColor(window.$("legendBgColorPicker")?.value || "#ffff66");
    });
    editor.addEventListener("input", window.syncLegend);
};

window.insertAtCaret = function (container, node) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(node);
    } else container.appendChild(node);
};

window.wrapSelection = function (modifier) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    if (r.collapsed) {
        const span = document.createElement("span");
        modifier(span); span.textContent = "text"; r.insertNode(span);
    } else {
        const span = document.createElement("span");
        modifier(span); span.appendChild(r.extractContents()); r.insertNode(span);
    }
    window.syncLegend();
};

window.applyTextColor = function (c) { window.wrapSelection(span => span.style.color = c); };

window.applyHighlightColor = function (c) {
    window.wrapSelection(span => {
        span.style.background = c;
        span.style.padding = "2px 4px";
        span.style.borderRadius = "4px";
    });
};

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", function () {
    window.syncLegend();
    window.renderLegendOverlay();
});