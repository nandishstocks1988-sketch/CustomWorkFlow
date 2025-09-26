// Enhanced drag and drop with animations
window.EnhancedDragDrop = {
    init: function () {
        // Enhance system drag and drop
        const systemList = document.getElementById('system-list');
        if (systemList) {
            new Sortable(systemList, {
                handle: '.system-drag-handle',
                animation: 150,
                ghostClass: 'drag-ghost',
                chosenClass: 'drag-chosen',
                dragClass: 'drag-dragging',
                onStart: function (evt) {
                    document.body.classList.add('dragging');
                },
                onEnd: function (evt) {
                    document.body.classList.remove('dragging');
                    window.applyListOrderToPlacement();
                }
            });
        }
    }
};