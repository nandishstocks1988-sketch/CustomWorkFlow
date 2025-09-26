/* ==========================================================================
   Systems - System Management Functionality
   ========================================================================== */

// Systems CRUD operations
window.addSystem = function (name, cfg = {}) {
    const sysName = (name || "").trim();
    if (!sysName) return { ok: false, error: "Empty name" };
    if (window.systems[sysName]) return { ok: false, error: "System already exists" };
    window.systems[sysName] = {
        stroke: cfg.stroke || "#333333",
        fill: cfg.fill || "#ffffff",
        layout: (cfg.layout === "horizontal" ? "horizontal" : "vertical"),
        row: 0,
        subgroups: {}
    };
    window.systemsOrder.push(sysName);
    window.ensurePlacement(sysName);
    return { ok: true };
};

window.renameSystem = function (oldName, newName) {
    const o = (oldName || "").trim();
    const n = (newName || "").trim();
    if (!o || !n) return { ok: false, error: "Names required" };
    if (!window.systems[o]) return { ok: false, error: "Original not found" };
    if (window.systems[n] && o !== n) return { ok: false, error: "New name exists" };

    if (o === n) return { ok: true, unchanged: true };
    window.systems[n] = window.systems[o];
    delete window.systems[o];

    // Update order
    window.systemsOrder = window.systemsOrder.map(s => (s === o ? n : s));
    // Update placement
    if (window.systemPlacement[o]) {
        window.systemPlacement[n] = window.systemPlacement[o];
        delete window.systemPlacement[o];
    }
    // Update nodes referencing old system
    window.nodes.forEach(nd => {
        if (nd.system === o) nd.system = n;
    });
    return { ok: true };
};

window.deleteSystem = function (name) {
    const nm = (name || "").trim();
    if (!window.systems[nm]) return { ok: false, error: "Not found" };
    delete window.systems[nm];
    window.systemsOrder = window.systemsOrder.filter(s => s !== nm);
    if (window.systemPlacement[nm]) delete window.systemPlacement[nm];
    // Clear nodes that referenced this system
    window.nodes.forEach(nd => {
        if (nd.system === nm) {
            nd.system = "";
            nd.subgroup = "";
        }
    });
    return { ok: true };
};

// UI rendering functions
window.renderSystemList = function () {
    const list = window.$("system-list");
    if (!list) return;

    list.innerHTML = "";

    // Add safety check for systemsOrder
    if (!window.systemsOrder || !window.systemsOrder.length) {
        list.innerHTML = "<div class='hint'>(No systems defined yet)</div>";
        return;
    }

    window.systemsOrder.forEach(name => {
        const cfg = window.systems[name];
        if (!cfg) return;

        const block = document.createElement("div");
        block.className = "system-block";
        block.draggable = true;
        block.dataset.system = name;

        const dragHandle = document.createElement("div");
        dragHandle.className = "system-drag-handle";
        dragHandle.textContent = "⋮⋮";
        block.appendChild(dragHandle);

        const collapseBtn = document.createElement("button");
        collapseBtn.type = "button";
        collapseBtn.className = "system-collapse-btn";
        collapseBtn.textContent = "▾";
        collapseBtn.addEventListener("click", () => {
            block.classList.toggle("collapsed");
            collapseBtn.textContent = block.classList.contains("collapsed") ? "▸" : "▾";
        });
        block.appendChild(collapseBtn);

        const header = document.createElement("div");
        header.className = "system-block-header";

        const inName = document.createElement("input");
        inName.value = name;

        const layout = document.createElement("select");
        ["vertical", "horizontal"].forEach(v => {
            const o = document.createElement("option");
            o.value = v;
            o.textContent = "Nodes " + (v === "vertical" ? "↓" : "→");
            layout.appendChild(o);
        });
        layout.value = cfg.layout;

        const stroke = document.createElement("input");
        stroke.type = "color";
        stroke.value = cfg.stroke;

        const fill = document.createElement("input");
        fill.type = "color";
        fill.value = cfg.fill;

        const save = document.createElement("button");
        save.textContent = "💾 Save";
        save.className = "system-btn small-btn";
        save.addEventListener("click", () => {
            const newName = inName.value.trim();
            if (!newName) return alert("Name required");
            if (newName !== name && window.systems[newName]) return alert("Name exists");

            if (newName !== name) {
                const result = window.renameSystem(name, newName);
                if (!result.ok) return alert(result.error);
            }

            const ref = window.systems[newName || name];
            ref.layout = layout.value;
            ref.stroke = window.sanitizeColor(stroke.value);
            ref.fill = window.sanitizeColor(fill.value);

            window.renderSystemList();
            if (typeof window.updateSystemDropdowns === 'function') window.updateSystemDropdowns();
            if (typeof window.scheduleRender === 'function') window.scheduleRender();
        });

        const del = document.createElement("button");
        del.textContent = "🗑️ Delete";
        del.className = "delete-btn small-btn";
        del.addEventListener("click", () => {
            if (!confirm(`Delete system "${name}"?`)) return;
            const result = window.deleteSystem(name);
            if (!result.ok) return alert(result.error);

            window.renderSystemList();
            if (typeof window.updateSystemDropdowns === 'function') window.updateSystemDropdowns();
            if (typeof window.updateNoSystemsHint === 'function') window.updateNoSystemsHint();
            if (typeof window.scheduleRender === 'function') window.scheduleRender();
        });

        header.append(inName, layout, stroke, fill, save, del);
        block.appendChild(header);

        // Subgroups section
        const body = document.createElement("div");
        body.className = "system-body";

        // Add subgroup form
        const sgRow = document.createElement("div");
        sgRow.style.cssText = "display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.4rem;";

        const sgName = document.createElement("input");
        sgName.placeholder = "Subgroup name";

        const sgLayout = document.createElement("select");
        ["vertical", "horizontal"].forEach(v => {
            const o = document.createElement("option");
            o.value = v;
            o.textContent = v;
            sgLayout.appendChild(o);
        });

        const sgFill = document.createElement("input");
        sgFill.type = "color";
        sgFill.value = "#eef5ff";

        const sgStroke = document.createElement("input");
        sgStroke.type = "color";
        sgStroke.value = "#9dbce6";

        const addSg = document.createElement("button");
        addSg.textContent = "➕ Add Subgroup";
        addSg.className = "system-btn small-btn";
        addSg.addEventListener("click", () => {
            const nm = sgName.value.trim();
            if (!nm) return alert("Name required");
            if (window.systems[name].subgroups[nm]) return alert("Exists");

            window.systems[name].subgroups[nm] = {
                layout: sgLayout.value,
                fill: window.sanitizeColor(sgFill.value),
                stroke: window.sanitizeColor(sgStroke.value)
            };
            sgName.value = "";

            window.renderSystemList();
            if (typeof window.updateSystemDropdowns === 'function') window.updateSystemDropdowns();
            if (typeof window.scheduleRender === 'function') window.scheduleRender();
        });

        sgRow.append(sgName, sgLayout, sgFill, sgStroke, addSg);
        body.appendChild(sgRow);

        // Existing subgroups
        Object.entries(cfg.subgroups || {}).forEach(([sg, scfg]) => {
            const rowDiv = document.createElement("div");
            rowDiv.className = "subgroup-row";

            const rInput = document.createElement("input");
            rInput.value = sg;

            const layE = document.createElement("select");
            ["vertical", "horizontal"].forEach(v => {
                const o = document.createElement("option");
                o.value = v;
                o.textContent = v;
                layE.appendChild(o);
            });
            layE.value = scfg.layout || "vertical";

            const fillE = document.createElement("input");
            fillE.type = "color";
            fillE.value = scfg.fill;

            const strokeE = document.createElement("input");
            strokeE.type = "color";
            strokeE.value = scfg.stroke;

            const saveSg = document.createElement("button");
            saveSg.textContent = "💾";
            saveSg.className = "system-btn small-btn";
            saveSg.addEventListener("click", () => {
                const newName = rInput.value.trim();
                if (!newName) return alert("Name required");
                if (newName !== sg && window.systems[name].subgroups[newName]) return alert("Exists");

                if (newName !== sg) {
                    window.systems[name].subgroups[newName] = { ...window.systems[name].subgroups[sg] };
                    delete window.systems[name].subgroups[sg];
                    window.nodes.forEach(n => {
                        if (n.system === name && n.subgroup === sg) n.subgroup = newName;
                    });
                }

                const tgt = window.systems[name].subgroups[newName];
                tgt.layout = layE.value;
                tgt.fill = window.sanitizeColor(fillE.value);
                tgt.stroke = window.sanitizeColor(strokeE.value);

                window.renderSystemList();
                if (typeof window.updateSystemDropdowns === 'function') window.updateSystemDropdowns();
                if (typeof window.scheduleRender === 'function') window.scheduleRender();
            });

            const delSg = document.createElement("button");
            delSg.textContent = "🗑️";
            delSg.className = "delete-btn small-btn";
            delSg.addEventListener("click", () => {
                if (!confirm(`Delete subgroup "${sg}"?`)) return;
                delete window.systems[name].subgroups[sg];
                window.nodes.forEach(n => {
                    if (n.system === name && n.subgroup === sg) n.subgroup = "";
                });

                window.renderSystemList();
                if (typeof window.updateSystemDropdowns === 'function') window.updateSystemDropdowns();
                if (typeof window.scheduleRender === 'function') window.scheduleRender();
            });

            rowDiv.append(rInput, layE, fillE, strokeE, saveSg, delSg);
            body.appendChild(rowDiv);
        });

        block.appendChild(body);
        list.appendChild(block);
    });

    if (typeof window.enableSystemListDrag === 'function') window.enableSystemListDrag();
};

window.updateNoSystemsHint = function () {
    const hint = window.$("noSystemsHint");
    if (hint) hint.textContent = Object.keys(window.systems).length ? "" : "No systems yet. Add one above.";
};

// Initialize systems on DOM ready
document.addEventListener("DOMContentLoaded", function () {
    if (typeof window.renderSystemList === 'function') {
        window.renderSystemList();
    }
});