// Fix for Add Node button
document.addEventListener("DOMContentLoaded", function () {
    // Wait for all scripts to load
    setTimeout(() => {
        // Connect the toolbar Add Node button
        const addNodeBtn = document.getElementById("addNodeBtn");
        if (addNodeBtn && !addNodeBtn.__nodeWired) {
            addNodeBtn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.addNode === 'function') {
                    window.addNode();
                    console.log("Node added via toolbar button");
                } else {
                    console.error("addNode function not available");
                }
            });
            addNodeBtn.__nodeWired = true;
            console.log("Toolbar Add Node button connected");
        }

        // Connect the nodes section Add Node button
        const addNodeEndBtn = document.getElementById("addNodeEndBtn");
        if (addNodeEndBtn && !addNodeEndBtn.__nodeWired) {
            addNodeEndBtn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.addNode === 'function') {
                    window.addNode();
                    console.log("Node added via nodes section button");
                } else {
                    console.error("addNode function not available");
                }
            });
            addNodeEndBtn.__nodeWired = true;
            console.log("Nodes section Add Node button connected");
        }

        // Also connect the floating action button
        const fabAddNodeBtn = document.getElementById("fabAddNodeBtn");
        if (fabAddNodeBtn && !fabAddNodeBtn.__nodeWired) {
            fabAddNodeBtn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.addNode === 'function') {
                    window.addNode();
                    console.log("Node added via FAB");
                }
            });
            fabAddNodeBtn.__nodeWired = true;
            console.log("FAB Add Node button connected");
        }
    }, 500); // Give time for all scripts to load
});