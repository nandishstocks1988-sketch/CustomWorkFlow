// Systems List Functionality Fixes
document.addEventListener('DOMContentLoaded', function () {
    // Fix button text visibility
    function fixButtonText() {
        // Fix all system buttons
        document.querySelectorAll('.system-btn').forEach(btn => {
            // Ensure text content is preserved
            if (btn.textContent.includes('💾')) {
                btn.innerHTML = '<span>💾 Save</span>';
            } else if (btn.textContent.includes('➕')) {
                btn.innerHTML = '<span>➕ Add Subgroup</span>';
            }
        });

        // Fix delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            if (btn.textContent.includes('🗑️')) {
                btn.innerHTML = '<span>🗑️ Delete</span>';
            }
        });
    }

    // Run fix after a short delay to ensure DOM is fully loaded
    setTimeout(fixButtonText, 100);

    // Also run fix whenever system list is updated
    const observer = new MutationObserver(fixButtonText);
    const systemList = document.getElementById('system-list');

    if (systemList) {
        observer.observe(systemList, {
            childList: true,
            subtree: true
        });
    }

    // Ensure select options are visible
    document.addEventListener('focus', function (e) {
        if (e.target.tagName === 'SELECT') {
            e.target.style.color = getComputedStyle(e.target).color || '#000';
        }
    }, true);

    // Fix color input visibility
    document.querySelectorAll('input[type="color"]').forEach(input => {
        input.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    });
});

// Override renderSystemList to ensure proper rendering
if (window.renderSystemList) {
    const originalRenderSystemList = window.renderSystemList;
    window.renderSystemList = function () {
        originalRenderSystemList.call(this);

        // Post-render fixes
        setTimeout(() => {
            // Ensure all inputs are visible
            document.querySelectorAll('.system-block input[type="text"]').forEach(input => {
                input.style.color = '';
                input.style.backgroundColor = '';
            });

            // Fix button visibility
            document.querySelectorAll('.system-btn, .delete-btn').forEach(btn => {
                btn.style.color = '';
            });
        }, 0);
    };
}