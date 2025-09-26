/* ====================== Layout (Simplified - No Canvas) ============================= */
function $(id) { return document.getElementById(id); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

// Simplified placement without canvas
function ensurePlacement(sys) {
    if (window.systemPlacement[sys]) return;
    const existingCount = Object.keys(window.systemPlacement).length;
    window.systemPlacement[sys] = { order: existingCount };
    rebuildSystemsOrder();
}

function rebuildSystemsOrder() {
    window.systemsOrder = Object.entries(window.systemPlacement)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([sys]) => sys);
}

function migrateLegacyPlacementIfNeeded() {
    if (Object.keys(window.systemPlacement).length) return;
    window.systemsOrder = window.systemsOrder.length ? window.systemsOrder : Object.keys(window.systems);
    window.systemsOrder.forEach((s, i) => {
        window.systemPlacement[s] = { order: i };
    });
    rebuildSystemsOrder();
}

// Update list order when dragged
function applyListOrderToPlacement() {
    const blocks = [...document.querySelectorAll("#system-list .system-block")];
    const ordered = blocks.map(b => b.dataset.system).filter(Boolean);

    ordered.forEach((sys, i) => {
        if (window.systemPlacement[sys]) {
            window.systemPlacement[sys].order = i;
        }
    });

    rebuildSystemsOrder();
    window.renderSystemList();

    // Update diagram when order changes
    if (typeof window.scheduleRender === 'function') {
        window.scheduleRender();
    }
}

function enableSystemListDrag() {
    const container = $("system-list");
    if (!container) return;
    let dragEl = null;

    container.querySelectorAll(".system-block").forEach(block => {
        block.addEventListener("dragstart", e => {
            dragEl = block;
            block.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
        });

        block.addEventListener("dragend", () => {
            block.classList.remove("dragging");
            $$(".system-block.drop-target").forEach(el => el.classList.remove("drop-target"));
            dragEl = null;
            applyListOrderToPlacement();
        });

        block.addEventListener("dragover", e => {
            e.preventDefault();
            const after = getAfter(container, e.clientY);
            container.querySelectorAll(".system-block").forEach(el => el.classList.remove("drop-target"));
            if (after == null) {
                container.appendChild(dragEl);
            } else {
                container.insertBefore(dragEl, after);
                after.classList.add("drop-target");
            }
        });
    });

    function getAfter(container, y) {
        const els = [...container.querySelectorAll(".system-block:not(.dragging)")];
        return els.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset, element: child };
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}

// Export functions
window.ensurePlacement = ensurePlacement;
window.rebuildSystemsOrder = rebuildSystemsOrder;
window.migrateLegacyPlacementIfNeeded = migrateLegacyPlacementIfNeeded;
window.enableSystemListDrag = enableSystemListDrag;
window.applyListOrderToPlacement = applyListOrderToPlacement;