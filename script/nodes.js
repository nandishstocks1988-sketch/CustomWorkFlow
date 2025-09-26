/* ==========================================================================
   Nodes - Node Management Functionality
   ========================================================================== */

// Node operations
window.addNode = function () {
    // Prevent duplicate execution
    if (window._addingNode) return;
    window._addingNode = true;

    setTimeout(() => {
        window._addingNode = false;
    }, 100);

    const id = `N${window.nodeCount++}`;
    const newNode = {
        id,
        label: "",
        shape: "rect",
        textColor: "#000000",
        bgColor: "#ffffff",
        outlineColor: "#333333",
        system: "",
        subgroup: "",
        desc: "",
        connections: []
    };
    window.nodes.push(newNode);
    if (window.$("nodes-container")) {
        window.$("nodes-container").appendChild(window.buildNodeCard(newNode));
    }
    if (typeof window.updateSystemDropdowns === 'function') {
        window.updateSystemDropdowns();
    }

    // Update diagram
    if (typeof window.scheduleRender === 'function') {
        window.scheduleRender();
    }
    if (typeof window.refreshDiagrams === 'function') {
        window.refreshDiagrams();
    }
    return newNode;
};

window.saveNode = function (id) {
    const node = window.nodes.find(n => n.id === id);
    if (!node) return;

    const card = document.querySelector(`.node[data-id='${CSS.escape(id)}']`);
    if (!card) return;

    node.label = card.querySelector(".node-name-input")?.value.trim() || "";
    node.desc = card.querySelector("textarea")?.value || "";
    node.shape = card.querySelector(".shape-select")?.value || "rect";
    node.system = card.querySelector(".system-select")?.value || "";
    node.subgroup = card.querySelector(".subgroup-select")?.value || "";
    node.textColor = window.sanitizeColor(card.querySelector(".text-color-select")?.value || "#000000");
    node.bgColor = window.sanitizeColor(card.querySelector(".bg-color-select")?.value || "#ffffff");
    node.outlineColor = window.sanitizeColor(card.querySelector(".outline-color-select")?.value || "#333333");
};

window.buildConnectionRow = function (targetId, conn) {
    const wrap = document.createElement("div");
    wrap.className = "connection-wrapper-adv";

    if (conn.arrow === undefined) conn.arrow = true;
    if (conn.width === undefined) conn.width = 2;
    if (conn.type === undefined) conn.type = "solid";
    if (conn.color === undefined) conn.color = "#333333";

    const peerSel = document.createElement("select");
    peerSel.className = "connect-select";
    peerSel.innerHTML = `<option value="">Source Node</option>` +
        window.nodes.filter(n => n.id !== targetId).map(n =>
            `<option value="${n.id}" ${n.id === conn.source ? "selected" : ""}>${window.esc(n.label || n.id)}</option>`
        ).join("");

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.placeholder = "Label";
    labelInput.value = conn.label || "";

    const typeSel = document.createElement("select");
    ["solid", "plain", "dashed", "dashedNo", "dotted", "dottedNo", "thick", "thickNo", "double", "none"]
        .forEach(t => {
            const o = document.createElement("option");
            o.value = t;
            o.textContent = t;
            if (conn.type === t) o.selected = true;
            typeSel.appendChild(o);
        });

    const arrowChk = document.createElement("input");
    arrowChk.type = "checkbox";
    arrowChk.checked = !!conn.arrow;
    arrowChk.title = "Arrow Head";

    const widthSel = document.createElement("select");
    for (let i = 1; i <= 6; i++) {
        const o = document.createElement("option");
        o.value = i;
        o.textContent = `W${i}`;
        if (conn.width === i) o.selected = true;
        widthSel.appendChild(o);
    }

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = window.sanitizeColor(conn.color || "#333333");

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "conn-delete-btn";
    delBtn.textContent = "✖";

    function sync() {
        conn.source = peerSel.value;
        conn.label = labelInput.value;
        conn.type = typeSel.value;
        conn.arrow = arrowChk.checked;
        conn.width = parseInt(widthSel.value, 10) || 2;
        conn.color = window.sanitizeColor(colorInput.value);
        if (typeof window.scheduleRender === 'function') {
            window.scheduleRender();
        }
    }

    [peerSel, labelInput, typeSel, widthSel, colorInput].forEach(el => {
        el.addEventListener(el.tagName === "SELECT" ? "change" : "input", sync);
    });
    arrowChk.addEventListener("change", sync);

    delBtn.addEventListener("click", () => {
        const node = window.nodes.find(n => n.id === targetId);
        if (!node) return;
        node.connections = node.connections.filter(c => c !== conn);
        wrap.remove();
        if (typeof window.scheduleRender === 'function') {
            window.scheduleRender();
        }
    });

    function mkField(lbl, el) {
        const f = document.createElement("div");
        f.className = "conn-field";
        const l = document.createElement("label");
        l.textContent = lbl;
        f.append(l, el);
        return f;
    }

    wrap.append(
        mkField("Source", peerSel),
        mkField("Label", labelInput),
        mkField("Type", typeSel),
        mkField("Width", widthSel),
        mkField("Color", colorInput)
    );

    const arrowWrap = document.createElement("div");
    arrowWrap.className = "conn-arrow-toggle";
    const arrowLab = document.createElement("label");
    arrowLab.style.fontSize = ".55rem";
    arrowLab.textContent = "Arrow";
    arrowWrap.append(arrowLab, arrowChk);

    wrap.append(arrowWrap, delBtn);
    return wrap;
};

window.populateSubgroups = function (systemName, selectEl, selected) {
    const subs = window.systems[systemName]?.subgroups || {};
    selectEl.innerHTML = `<option value="">-- Subgroup --</option>` +
        Object.keys(subs).map(sg =>
            `<option value="${sg}" ${sg === selected ? "selected" : ""}>${sg}</option>`
        ).join("");
};

window.buildNodeCard = function (n) {
    const card = document.createElement("div");
    card.className = "node";
    card.dataset.id = n.id;

    const collapseBtn = document.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "node-collapse-btn";
    collapseBtn.textContent = "▾";
    collapseBtn.addEventListener("click", () => {
        card.classList.toggle("collapsed");
        collapseBtn.textContent = card.classList.contains("collapsed") ? "▸" : "▾";
    });
    card.appendChild(collapseBtn);

    const titleBar = document.createElement("div");
    titleBar.className = "node-title-bar";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Name";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "node-name-input";
    nameInput.placeholder = "Step name";
    nameInput.value = n.label;

    titleBar.append(nameLabel, nameInput);
    card.appendChild(titleBar);

    const grid = document.createElement("div");
    grid.className = "node-inner-grid";

    function wrap(label, el) {
        const w = document.createElement("div");
        const l = document.createElement("label");
        l.textContent = label;
        w.append(l, el);
        return w;
    }

    const desc = document.createElement("textarea");
    desc.rows = 2;
    desc.placeholder = "Description";
    desc.value = n.desc || "";

    const shape = document.createElement("select");
    shape.className = "shape-select";
    ["rect", "round", "stadium", "subroutine", "cylinder", "circle", "diamond"].forEach(s => {
        const o = document.createElement("option");
        o.value = s;
        o.textContent = s;
        if (n.shape === s) o.selected = true;
        shape.appendChild(o);
    });

    const sysSel = document.createElement("select");
    sysSel.className = "system-select";
    const sgSel = document.createElement("select");
    sgSel.className = "subgroup-select";

    const textColor = document.createElement("input");
    textColor.type = "color";
    textColor.value = n.textColor;
    textColor.className = "text-color-select";

    const bgColor = document.createElement("input");
    bgColor.type = "color";
    bgColor.value = n.bgColor;
    bgColor.className = "bg-color-select";

    const outlineColor = document.createElement("input");
    outlineColor.type = "color";
    outlineColor.value = n.outlineColor;
    outlineColor.className = "outline-color-select";

    const connContainer = document.createElement("div");
    connContainer.className = "connections-container";
    n.connections.forEach(c => connContainer.appendChild(window.buildConnectionRow(n.id, c)));

    const addConn = document.createElement("button");
    addConn.type = "button";
    addConn.textContent = "➕ Add Connection";
    addConn.className = "add-conn-btn small-btn";
    addConn.addEventListener("click", () => {
        n.connections.push({
            source: "",
            label: "",
            type: "solid",
            color: "#333333",
            width: 2,
            arrow: true
        });
        connContainer.appendChild(window.buildConnectionRow(n.id, n.connections[n.connections.length - 1]));
    });

    const delNode = document.createElement("button");
    delNode.type = "button";
    delNode.textContent = "🗑️ Delete Node";
    delNode.className = "delete-btn small-btn";
    delNode.addEventListener("click", () => {
        if (!confirm("Delete this node?")) return;
        window.nodes = window.nodes.filter(x => x.id !== n.id);
        card.remove();
        if (typeof window.updateConnectDropdowns === 'function') window.updateConnectDropdowns();
        if (typeof window.scheduleRender === 'function') {
            window.scheduleRender();
        }
    });

    [nameInput, desc, shape, sysSel, sgSel, textColor, bgColor, outlineColor].forEach(el => {
        el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
            window.saveNode(n.id);
            if (el === sysSel) window.populateSubgroups(sysSel.value, sgSel, "");
            if (typeof window.scheduleRender === 'function') {
                window.scheduleRender();
            }
            if (typeof window.updateConnectDropdowns === 'function') window.updateConnectDropdowns();
        });
    });

    grid.append(
        wrap("Desc", desc),
        wrap("Shape", shape),
        wrap("System", sysSel),
        wrap("Subgroup", sgSel),
        wrap("Text", textColor),
        wrap("Fill", bgColor),
        wrap("Outline", outlineColor),
        connContainer,
        addConn,
        delNode
    );
    card.appendChild(grid);

    if (!window.isImporting) {
        if (typeof window.updateSystemDropdowns === 'function') window.updateSystemDropdowns();
        if (n.system) sysSel.value = n.system;
        window.populateSubgroups(n.system, sgSel, n.subgroup);
    }

    return card;
};

window.updateSystemDropdowns = function () {
    window.$$(".node .system-select").forEach(sel => {
        const cur = sel.value;
        sel.innerHTML = `<option value="">-- System --</option>` +
            Object.keys(window.systems).map(s =>
                `<option value="${s}" ${s === cur ? "selected" : ""}>${s}</option>`
            ).join("");
    });

    window.$$(".node .subgroup-select").forEach(sel => {
        const root = sel.closest(".node");
        const sys = root?.querySelector(".system-select")?.value;
        const cur = sel.value;
        const subs = window.systems[sys]?.subgroups || {};

        sel.innerHTML = `<option value="">-- Subgroup --</option>` +
            Object.keys(subs).map(sg =>
                `<option value="${sg}" ${sg === cur ? "selected" : ""}>${sg}</option>`
            ).join("");
    });
};

window.updateConnectDropdowns = function () {
    window.$$(".connection-wrapper-adv .connect-select").forEach(sel => {
        const nodeEl = sel.closest(".node");
        const targetId = nodeEl?.dataset.id;
        const current = sel.value;

        sel.innerHTML = `<option value="">Source Node</option>` +
            window.nodes.filter(n => n.id !== targetId).map(n =>
                `<option value="${n.id}" ${n.id === current ? "selected" : ""}>${window.esc(n.label || n.id)}</option>`
            ).join("");

        sel.value = current;
    });
};

// Initialize nodes functionality - CRITICAL: Wait for DOM to be ready
// Initialize nodes functionality
document.addEventListener("DOMContentLoaded", function () {
    const container = window.$("nodes-container");

    // Add safety check for nodes array
    if (container && window.nodes && window.nodes.length > 0) {
        container.innerHTML = "";
        window.nodes.forEach(n => {
            container.appendChild(window.buildNodeCard(n));
        });
    }

    // Node button wiring is now handled in fix-node-button.js to avoid conflicts

    // Collapse/expand buttons - add safety check for bindClick
    if (typeof window.bindClick === 'function') {
        window.bindClick("collapseAllNodesBtn", () => window.toggleAllNodes(true));
        window.bindClick("expandAllNodesBtn", () => window.toggleAllNodes(false));
    } else {
        // Fallback if bindClick isn't available yet
        setTimeout(() => {
            if (typeof window.bindClick === 'function') {
                window.bindClick("collapseAllNodesBtn", () => window.toggleAllNodes(true));
                window.bindClick("expandAllNodesBtn", () => window.toggleAllNodes(false));
            }
        }, 100);
    }
});