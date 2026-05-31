// Global Dark Mode Handler
(function() {
    const themeToggle = document.getElementById('themeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');
    
    // Apply theme on page load
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark-mode');
    } else if (prefersDark.matches) {
        document.documentElement.classList.add('dark-mode');
    }
    
    // Toggle theme function
    window.toggleTheme = function() {
        document.documentElement.classList.toggle('dark-mode');
        const isDark = document.documentElement.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Update mobile toggle button if exists
        const mobileToggle = document.getElementById('mobileThemeToggle');
        if (mobileToggle) {
            mobileToggle.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    };
    
    // Add event listener to main toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', window.toggleTheme);
    }
    
    // Handle mobile toggle if exists
    const mobileToggle = document.getElementById('mobileThemeToggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', window.toggleTheme);
        const isDark = document.documentElement.classList.contains('dark-mode');
        mobileToggle.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
})();