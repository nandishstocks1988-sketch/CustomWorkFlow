// Fix for legend editor color buttons
document.addEventListener('DOMContentLoaded', function () {
    // Ensure color buttons work properly
    const colorButtons = document.querySelectorAll('.color-btn');
    const legendEditor = document.getElementById('legendEditor');

    colorButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const color = this.getAttribute('data-color');

            if (legendEditor && color) {
                // Get current selection or create new span at cursor
                const selection = window.getSelection();

                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);

                    if (range.collapsed) {
                        // No text selected, insert colored text
                        const span = document.createElement('span');
                        span.style.color = color;
                        span.textContent = 'Text';
                        range.insertNode(span);

                        // Move cursor after the inserted text
                        range.setStartAfter(span);
                        range.setEndAfter(span);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } else {
                        // Text is selected, wrap it in color
                        const span = document.createElement('span');
                        span.style.color = color;

                        try {
                            range.surroundContents(span);
                        } catch (e) {
                            // If surroundContents fails, extract and insert
                            const contents = range.extractContents();
                            span.appendChild(contents);
                            range.insertNode(span);
                        }
                    }
                }

                // Trigger sync
                if (typeof window.syncLegend === 'function') {
                    window.syncLegend();
                }

                // Keep focus on editor
                legendEditor.focus();
            }
        });
    });
});