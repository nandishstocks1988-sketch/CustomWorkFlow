/* ============================= Exporters ================================== */

window.buildExportLegend = function () {
    const include = window.$("exportDescriptionsChk");
    if (!include || !include.checked) return window.diagramLegend;
    if (!window.nodes.some(n => n.desc)) return window.diagramLegend;
    const notes = window.nodes.filter(n => n.desc).map(n => `<div><strong>${window.esc(n.label || n.id)}:</strong> ${window.esc(n.desc)}</div>`).join("");
    return window.diagramLegend +
        `<hr style="margin:4px 0;border:none;border-top:1px solid #ddd;">` +
        `<div style="font-size:11px;"><strong>Node Notes</strong><br/>${notes}</div>`;
};

window.downloadJSON = function () {
    window.nodes.forEach(n => window.saveNode(n.id));
    const data = {
        systems: window.systems,
        systemsOrder: window.systemsOrder,
        systemsArrangement: window.systemsArrangement,
        diagramLegend: window.diagramLegend,
        systemPlacement: window.systemPlacement,
        nodes: window.nodes.map(n => ({
            id: n.id, label: n.label, shape: n.shape, textColor: n.textColor, bgColor: n.bgColor,
            outlineColor: n.outlineColor, system: n.system, subgroup: n.subgroup, desc: n.desc,
            connections: n.connections.map(c => ({ ...c }))
        }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "diagram.json"; a.click();
    URL.revokeObjectURL(url);
};

window.downloadPNG = async function () {
    window.generateMermaid();
    const diagram = window.$("diagram"); if (!diagram) return;
    const overlay = window.$("legendOverlayContent");
    const original = overlay ? overlay.innerHTML : "";
    const augmented = window.buildExportLegend();
    if (augmented !== window.diagramLegend && overlay) {
        overlay.innerHTML = augmented; window.$("legendOverlay")?.classList.remove("hidden");
    }
    window.$("nodeTooltip")?.classList.add("hidden");
    await new Promise(r => setTimeout(r, 50));
    if (typeof html2canvas === "undefined") return alert("html2canvas not loaded");
    html2canvas(diagram, { scale: 2, backgroundColor: "#ffffff" }).then(canvas => {
        canvas.toBlob(b => {
            const a = document.createElement("a");
            a.download = "diagram.png"; a.href = URL.createObjectURL(b); a.click();
            if (overlay) { overlay.innerHTML = original; window.renderLegendOverlay(); }
        }, "image/png");
    });
};

window.downloadPDF = function () {
    window.generateMermaid();
    const diagram = window.$("diagram"); if (!diagram) return;
    const overlay = window.$("legendOverlayContent");
    const original = overlay ? overlay.innerHTML : "";
    const augmented = window.buildExportLegend();
    if (augmented !== window.diagramLegend && overlay) {
        overlay.innerHTML = augmented; window.$("legendOverlay")?.classList.remove("hidden");
    }
    window.$("nodeTooltip")?.classList.add("hidden");
    if (!window.jspdf) return alert("jsPDF not loaded");
    html2canvas(diagram, { scale: 2, backgroundColor: "#ffffff" }).then(canvas => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [canvas.width, canvas.height] });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save("diagram.pdf");
        if (overlay) { overlay.innerHTML = original; window.renderLegendOverlay(); }
    });
};

window.downloadSVG = function () {
    window.generateMermaid();
    const svgEl = window.$("diagram")?.querySelector("svg");
    if (!svgEl) { alert("Render diagram first."); return; }
    const clone = svgEl.cloneNode(true);
    const augmented = window.buildExportLegend();
    if (augmented) {
        const vb = clone.viewBox?.baseVal;
        const width = vb?.width || 1000;
        const height = vb?.height || 800;
        const w = 300;
        const temp = document.createElement("div");
        temp.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:300px;font:12px system-ui;";
        temp.innerHTML = augmented;
        document.body.appendChild(temp);
        const h = Math.min(Math.max(temp.getBoundingClientRect().height + 14, 40), 700);
        temp.remove();
        const x = width - w - 10, y = height - h - 10;
        const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        fo.setAttribute("x", x); fo.setAttribute("y", y);
        fo.setAttribute("width", w); fo.setAttribute("height", h);
        const div = document.createElement("div");
        div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        div.style.cssText = "font:12px system-ui,Arial,sans-serif;background:rgba(255,255,255,.95);border:1px solid #d0d7de;border-radius:6px;padding:6px 8px;line-height:1.25;";
        div.innerHTML = augmented;
        fo.appendChild(div); clone.appendChild(fo);
    }
    const serialized = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([serialized], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "diagram.svg"; a.click();
    URL.revokeObjectURL(url);
};

window.handleJSONUpload = function (e) {
    const file = e.target.files?.[0];
    if (!file) return;
    window.isImporting = true;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const raw = JSON.parse(ev.target.result);
            const norm = window.normalizeImportedJSON(raw);
            window.applyImportedState(norm);
            window.rebuildUI_AfterImport();
            window.postImportPipeline();
            alert("JSON Loaded");
        } catch (err) {
            window.isImporting = false;
            alert("Import failed: " + err.message);
        }
    };
    reader.readAsText(file);
};

// Import helpers
window.normalizeImportedJSON = function (raw) {
    return {
        systems: raw.systems || {},
        systemsOrder: raw.systemsOrder || [],
        systemsArrangement: raw.systemsArrangement || "vertical",
        diagramLegend: raw.diagramLegend || "",
        systemPlacement: raw.systemPlacement || {},
        nodes: (raw.nodes || []).map(n => ({
            id: n.id,
            label: n.label || "",
            shape: n.shape || "rect",
            textColor: n.textColor || "#000000",
            bgColor: n.bgColor || "#ffffff",
            outlineColor: n.outlineColor || "#333333",
            system: n.system || "",
            subgroup: n.subgroup || "",
            desc: n.desc || "",
            connections: (n.connections || []).map(c => ({
                source: c.source || "",
                label: c.label || "",
                type: c.type || "solid",
                color: c.color || "#333333",
                width: c.width || 2,
                arrow: c.arrow !== false
            }))
        }))
    };
};

window.applyImportedState = function (norm) {
    window.systems = norm.systems;
    window.systemsOrder = norm.systemsOrder;
    window.systemsArrangement = norm.systemsArrangement;
    window.diagramLegend = norm.diagramLegend;
    window.systemPlacement = norm.systemPlacement;
    window.nodes = norm.nodes;

    // Update nodeCount
    const maxId = window.nodes.reduce((max, n) => {
        const match = n.id.match(/^N(\d+)$/);
        return match ? Math.max(max, parseInt(match[1])) : max;
    }, -1);
    window.nodeCount = maxId + 1;
};

window.rebuildUI_AfterImport = function () {
    if (window.$("systemsArrangementSelect"))
        window.$("systemsArrangementSelect").value = window.systemsArrangement;

    if (window.$("legendEditor"))
        window.$("legendEditor").innerHTML = window.diagramLegend;

    window.renderSystemList();

    const nodesContainer = window.$("nodes-container");
    if (nodesContainer) {
        nodesContainer.innerHTML = "";
        window.nodes.forEach(n => {
            nodesContainer.appendChild(window.buildNodeCard(n));
        });
    }
};

window.postImportPipeline = function () {
    window.isImporting = false;
    if (typeof window.updateSystemDropdowns === 'function') window.updateSystemDropdowns();
    if (typeof window.updateConnectDropdowns === 'function') window.updateConnectDropdowns();
    if (typeof window.updateNoSystemsHint === 'function') window.updateNoSystemsHint();
    if (typeof window.generateMermaid === 'function') window.generateMermaid();
    if (typeof window.renderLegendOverlay === 'function') window.renderLegendOverlay();
};