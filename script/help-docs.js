// Help and Documentation functionality
document.addEventListener('DOMContentLoaded', function () {
    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const faqItem = button.parentElement;
            const wasActive = faqItem.classList.contains('active');

            // Close all FAQs
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });

            // Toggle current FAQ
            if (!wasActive) {
                faqItem.classList.add('active');
            }
        });
    });

    // Documentation Tabs
    document.querySelectorAll('.doc-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            // Update active tab
            document.querySelectorAll('.doc-tab').forEach(t => {
                t.classList.remove('active');
            });
            tab.classList.add('active');

            // Show corresponding content
            document.querySelectorAll('.doc-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`doc-${targetTab}`)?.classList.add('active');
        });
    });

    // Quick keyboard shortcut for help
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F1') {
            e.preventDefault();
            const helpPanel = document.getElementById('helpPanel');
            helpPanel?.classList.toggle('hidden');
        }
    });
});