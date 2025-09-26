// Auto-adjust input width based on content
document.addEventListener('DOMContentLoaded', function () {
    const sysNameInput = document.getElementById('sysNameInput');

    if (sysNameInput) {
        // Create a hidden span to measure text width
        const measureSpan = document.createElement('span');
        measureSpan.style.position = 'absolute';
        measureSpan.style.visibility = 'hidden';
        measureSpan.style.whiteSpace = 'pre';
        measureSpan.style.font = window.getComputedStyle(sysNameInput).font;
        document.body.appendChild(measureSpan);

        function adjustWidth() {
            const value = sysNameInput.value || sysNameInput.placeholder;
            measureSpan.textContent = value;

            // Calculate width with some padding
            const textWidth = measureSpan.offsetWidth;
            const newWidth = Math.min(Math.max(120, textWidth + 30), 300);

            sysNameInput.style.width = newWidth + 'px';
        }

        // Adjust on input
        sysNameInput.addEventListener('input', adjustWidth);

        // Initial adjustment
        adjustWidth();
    }
});