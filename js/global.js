/* ============================================
   GLOBAL.JS - Shared across ALL pages
   Handles: Dark Mode, Mobile Menu, Navigation
   ============================================ */

(function() {
    'use strict';

    // ========== DARK MODE ==========
    const themeToggle = document.getElementById('themeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');
    
    // Apply saved theme or system preference
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
        
        // Update mobile toggle button text if exists
        const mobileToggle = document.getElementById('mobileThemeToggle');
        if (mobileToggle) {
            mobileToggle.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    };
    
    // Add click event to theme toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', window.toggleTheme);
    }
    
    // Mobile theme toggle (if exists in mobile menu)
    const mobileToggle = document.getElementById('mobileThemeToggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', window.toggleTheme);
        const isDark = document.documentElement.classList.contains('dark-mode');
        mobileToggle.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
    
    // ========== MOBILE MENU ==========
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    
    function openMenu() {
        if (mobileMenu) mobileMenu.classList.add('open');
        if (menuOverlay) menuOverlay.classList.add('active');
        if (hamburgerBtn) hamburgerBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        if (mobileMenu) mobileMenu.classList.remove('open');
        if (menuOverlay) menuOverlay.classList.remove('active');
        if (hamburgerBtn) hamburgerBtn.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', openMenu);
    }
    
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }
    
    // Close mobile menu when clicking on navigation links
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    
    // ========== ACTIVE NAVIGATION LINK ==========
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
    
    // ========== SMOOTH SCROLL (for documentation page) ==========
    document.querySelectorAll('.sidebar-link, .toc-link, .back-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const hash = this.getAttribute('href');
            if (hash && hash.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(hash);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    // Update URL without jumping
                    history.pushState(null, null, hash);
                }
            }
        });
    });
    
    // ========== DROPDOWN SIDEBAR (for documentation page) ==========
    function initDropdowns() {
        const groups = document.querySelectorAll('.nav-group');
        groups.forEach(group => {
            const button = group.querySelector('.nav-title');
            if (button && !group.hasAttribute('data-initialized')) {
                group.setAttribute('data-initialized', 'true');
                
                // Open first group by default (Getting Started)
                const isFirst = group.id === 'group-getting-started';
                if (isFirst) {
                    group.classList.add('open');
                }
                
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    group.classList.toggle('open');
                });
            }
        });
    }
    
    // Run dropdown init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDropdowns);
    } else {
        initDropdowns();
    }
    
    // ========== ACTIVE SECTION HIGHLIGHTING (for documentation page) ==========
    const sections = document.querySelectorAll('.docs section');
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-links a');
    
    function updateActiveLink() {
        if (sections.length === 0) return;
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionBottom = sectionTop + section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
                current = section.getAttribute('id');
            }
        });
        
        sidebarLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href.substring(1) === current) {
                link.classList.add('active');
            }
        });
    }
    
    if (sections.length > 0) {
        window.addEventListener('scroll', updateActiveLink);
        updateActiveLink();
    }
    
})();