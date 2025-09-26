// Definitive Node Layout Fix - Exactly 3 lines as specified
document.addEventListener('DOMContentLoaded', function () {

    // Override the buildNodeCard function to create proper structure
    const originalBuildNodeCard = window.buildNodeCard;
    if (originalBuildNodeCard) {
        window.buildNodeCard = function (n) {
            const card = document.createElement("div");
            card.className = "node";
            card.dataset.id = n.id;

            // Collapse button
            const collapseBtn = document.createElement("button");
            collapseBtn.type = "button";
            collapseBtn.className = "node-collapse-btn";
            collapseBtn.textContent = "▾";
            collapseBtn.addEventListener("click", () => {
                card.classList.toggle("collapsed");
                collapseBtn.textContent = card.classList.contains("collapsed") ? "▸" : "▾";
            });
            card.appendChild(collapseBtn);

            // Title bar
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

            // Create the grid container
            const grid = document.createElement("div");
            grid.className = "node-inner-grid";

            // Helper function to create field
            function createField(label, element) {
                const wrapper = document.createElement("div");
                wrapper.className = "field-wrapper";
                const labelEl = document.createElement("label");
                labelEl.textContent = label;
                wrapper.append(labelEl, element);
                return wrapper;
            }

            // LINE 1: Name, Description, Delete button
            const line1 = document.createElement("div");
            line1.className = "node-line-1";

            // Name field (reuse from title bar)
            const nameField = createField("Name", nameInput.cloneNode(true));
            nameField.className = "field-name";

            // Description
            const desc = document.createElement("textarea");
            desc.rows = 2;
            desc.placeholder = "Description";
            desc.value = n.desc || "";
            const descField = createField("Desc", desc);
            descField.className = "field-desc";

            // Delete button
            const delNode = document.createElement("button");
            delNode.type = "button";
            delNode.textContent = "🗑️ Delete Node";
            delNode.className = "delete-btn small-btn";

            line1.appendChild(nameField);
            line1.appendChild(descField);
            line1.appendChild(delNode);

            // LINE 2: Shape through Add Connection button
            const line2 = document.createElement("div");
            line2.className = "node-line-2";

            // Shape
            const shape = document.createElement("select");
            shape.className = "shape-select";
            ["rect", "round", "stadium", "subroutine", "cylinder", "circle", "diamond"].forEach(s => {
                const o = document.createElement("option");
                o.value = s;
                o.textContent = s;
                if (n.shape === s) o.selected = true;
                shape.appendChild(o);
            });

            // System
            const sysSel = document.createElement("select");
            sysSel.className = "system-select";

            // Subgroup
            const sgSel = document.createElement("select");
            sgSel.className = "subgroup-select";

            // Colors
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

            // Add Connection button
            const addConn = document.createElement("button");
            addConn.type = "button";
            addConn.textContent = "➕ Add Connection";
            addConn.className = "add-conn-btn small-btn";

            line2.appendChild(createField("Shape", shape));
            line2.appendChild(createField("System", sysSel));
            line2.appendChild(createField("Subgroup", sgSel));
            line2.appendChild(createField("Text", textColor));
            line2.appendChild(createField("Fill", bgColor));
            line2.appendChild(createField("Outline", outlineColor));
            line2.appendChild(addConn);

            // LINE 3: Connections container
            const line3 = document.createElement("div");
            line3.className = "node-line-3";

            const connContainer = document.createElement("div");
            connContainer.className = "connections-container";
            line3.appendChild(connContainer);

            // Add all lines to grid
            grid.appendChild(line1);
            grid.appendChild(line2);
            grid.appendChild(line3);
            card.appendChild(grid);

            // Wire up functionality
            n.connections.forEach(c => connContainer.appendChild(window.buildConnectionRow(n.id, c)));

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

            delNode.addEventListener("click", () => {
                if (!confirm("Delete this node?")) return;
                window.nodes = window.nodes.filter(x => x.id !== n.id);
                card.remove();
                if (typeof window.updateConnectDropdowns === 'function') window.updateConnectDropdowns();
                if (typeof window.scheduleRender === 'function') window.scheduleRender();
            });

            // Wire up save functionality
            const inputs = [nameField.querySelector('input'), desc, shape, sysSel, sgSel, textColor, bgColor, outlineColor];
            inputs.forEach(el => {
                el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
                    window.saveNode(n.id);
                    if (el === sysSel) window.populateSubgroups(sysSel.value, sgSel, "");
                    if (typeof window.scheduleRender === 'function') window.scheduleRender();
                    if (typeof window.updateConnectDropdowns === 'function') window.updateConnectDropdowns();
                });
            });

            // Initialize dropdowns
            if (!window.isImporting) {
                if (typeof window.updateSystemDropdowns === 'function') window.updateSystemDropdowns();
                if (n.system) sysSel.value = n.system;
                window.populateSubgroups(n.system, sgSel, n.subgroup);
            }

            return card;
        };
    }

    // Rebuild all existing nodes
    const container = document.getElementById('nodes-container');
    if (container && window.nodes && window.nodes.length > 0) {
        const existingNodes = Array.from(window.nodes);
        container.innerHTML = '';
        existingNodes.forEach(n => {
            container.appendChild(window.buildNodeCard(n));
        });
    }
});