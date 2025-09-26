/* ==========================================================================
   Events - Wire up all event handlers for the application
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    // Wire up system form
    const sysForm = document.getElementById("add-system-form");
    if (sysForm) {
        sysForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const name = document.getElementById("sysNameInput").value.trim();
            if (!name) return;

            const result = window.addSystem(name, {
                stroke: document.getElementById("sysStrokeInput").value || "#333333",
                fill: document.getElementById("sysFillInput").value || "#ffffff",
                layout: document.getElementById("sysLayoutSelect").value || "vertical"
            });

            if (!result.ok) {
                alert(result.error);
                return;
            }

            document.getElementById("sysNameInput").value = "";

            // Refresh UI
            window.renderSystemList();
            if (typeof window.updateSystemDropdowns === 'function') window.updateSystemDropdowns();
            if (typeof window.updateNoSystemsHint === 'function') window.updateNoSystemsHint();
            if (typeof window.scheduleRender === 'function') window.scheduleRender();
        });
    }
    // Wire up generate buttons to force mxGraph update
    window.bindClick("showPreviewBtn", function () {
        // Show Preview should regenerate mxGraph from current data
        window.generateMermaid();
    });

    window.bindClick("generateBtn", function () {
        // Update Diagram should regenerate everything from current data
        window.generateMermaid();
    });

    window.bindClick("fabUpdateBtn", function () {
        // FAB Update should also regenerate from current data
        window.generateMermaid();
    });


    // Wire up help and docs panels
    window.bindClick("helpQuickBtn", () => {
        window.$("helpPanel").classList.toggle("hidden");
    });

    window.bindClick("closeHelpBtn", () => {
        window.$("helpPanel").classList.add("hidden");
    });

    window.bindClick("docsBtn", () => {
        window.$("docsPanel").classList.toggle("hidden");
    });

    window.bindClick("closeDocsBtn", () => {
        window.$("docsPanel").classList.add("hidden");
    });

    window.bindClick("openDocsFromHelp", () => {
        window.$("helpPanel").classList.add("hidden");
        window.$("docsPanel").classList.remove("hidden");
    });

    // Wire up section collapsers
    window.$$(".section-collapse-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.target;
            const panel = document.querySelector(`.panel[data-panel="${target}"]`);
            if (panel) {
                panel.classList.toggle("collapsed");
                btn.textContent = panel.classList.contains("collapsed") ? "▸" : "▾";
            }
        });
    });

    // Wire up legend editor
    if (typeof window.wireLegendEditor === 'function') window.wireLegendEditor();

    // Wire up export buttons
    window.bindClick("downloadJsonBtn", window.downloadJSON);
    window.bindClick("downloadPngBtn", window.downloadPNG);
    window.bindClick("downloadPdfBtn", window.downloadPDF);
    window.bindClick("downloadSvgBtn", window.downloadSVG);

    // Wire up FAB buttons (except add node which is handled in fix-node-button.js)
    window.bindClick("fabUpdateBtn", window.generateMermaid);
    window.bindClick("fabJsonBtn", window.downloadJSON);
    window.bindClick("fabPngBtn", window.downloadPNG);
    window.bindClick("fabPdfBtn", window.downloadPDF);
    window.bindClick("fabSvgBtn", window.downloadSVG);

    // Wire up page background selector
    const pageBgSelect = window.$("pageBgColor");
    if (pageBgSelect) {
        pageBgSelect.addEventListener("change", () => {
            document.body.style.backgroundColor = pageBgSelect.value;
        });
    }

    // Wire up diagram background color
    const diagramBgInput = window.$("diagramBgColor");
    if (diagramBgInput) {
        diagramBgInput.addEventListener("change", () => {
            const diagram = window.$("diagram");
            if (diagram) {
                diagram.style.backgroundColor = diagramBgInput.value;
            }
            const mxContainer = window.$("mxgraph-container");
            if (mxContainer) {
                mxContainer.style.backgroundColor = diagramBgInput.value;
            }
        });
    }

    // Wire up systems arrangement
    const sysArrangementSelect = window.$("systemsArrangementSelect");
    if (sysArrangementSelect) {
        sysArrangementSelect.addEventListener("change", () => {
            window.systemsArrangement = sysArrangementSelect.value;
            if (typeof window.scheduleRender === 'function') window.scheduleRender();
        });
    }

    // Wire up collapse/expand all systems
    window.bindClick("collapseAllSystemsBtn", () => {
        window.$$(".system-block").forEach(block => {
            block.classList.add("collapsed");
            const btn = block.querySelector(".system-collapse-btn");
            if (btn) btn.textContent = "▸";
        });
    });

    window.bindClick("expandAllSystemsBtn", () => {
        window.$$(".system-block").forEach(block => {
            block.classList.remove("collapsed");
            const btn = block.querySelector(".system-collapse-btn");
            if (btn) btn.textContent = "▾";
        });
    });

    // Update hints
    if (typeof window.updateNoSystemsHint === 'function') window.updateNoSystemsHint();

    // Initialize system list
    if (typeof window.renderSystemList === 'function') window.renderSystemList();

    // Generate initial diagram
    // Generate initial diagram
    setTimeout(() => {
        if (typeof window.generateMermaid === 'function') {
            window.generateMermaid();
        }
        // Also render mxGraph initially
        if (typeof window.renderMxGraphDiagram === 'function') {
            const mxContainer = window.$("mxgraph-container");
            if (mxContainer) {
                window.renderMxGraphDiagram();
            }
        }
    }, 500);
    const showPreviewBtn = window.$("showPreviewBtn");
    if (showPreviewBtn) {
        showPreviewBtn.addEventListener("click", function () {
            const mxContainer = window.$("mxgraph-container");
            if (mxContainer && typeof window.renderMxGraphDiagram === 'function') {
                window.renderMxGraphDiagram();
            }
        });
    }
});