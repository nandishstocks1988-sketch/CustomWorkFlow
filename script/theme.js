// Theme management
document.addEventListener('DOMContentLoaded', function () {
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle?.querySelector('i');

    // Check for saved theme preference or default to light
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Update icon
    if (icon) {
        icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Theme toggle
    themeToggle?.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);

        // Update icon with animation
        icon.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            icon.className = next === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            icon.style.transform = 'rotate(0deg)';
        }, 150);
    });
});