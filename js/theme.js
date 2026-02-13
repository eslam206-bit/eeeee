class ThemeManager {
    constructor() {
        this.storageKey = 'ems-theme';
        this.darkClass = 'dark-theme';
        this.init();
    }

    init() {
        const savedTheme = this.getSavedTheme();
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light');
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.getSavedTheme()) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    getSavedTheme() {
        try {
            return localStorage.getItem(this.storageKey);
        } catch (e) {
            return null;
        }
    }

    setTheme(theme) {
        const html = document.documentElement;
        const toggleButtons = document.querySelectorAll('.theme-toggle .icon');
        const toggleTexts = document.querySelectorAll('.theme-toggle .text');
        
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            html.classList.add(this.darkClass);
            toggleButtons.forEach(btn => btn.textContent = '☀️');
            toggleTexts.forEach(txt => txt.textContent = 'الوضع النهاري');
        } else {
            html.removeAttribute('data-theme');
            html.classList.remove(this.darkClass);
            toggleButtons.forEach(btn => btn.textContent = '🌙');
            toggleTexts.forEach(txt => txt.textContent = 'الوضع الليلي');
        }

        try {
            localStorage.setItem(this.storageKey, theme);
        } catch (e) {
            console.warn('Could not save theme preference');
        }

        this.updateThemeAriaLabel(theme);
    }

    updateThemeAriaLabel(theme) {
        const toggleButtons = document.querySelectorAll('.theme-toggle');
        const label = theme === 'dark' ? 'تبديل إلى الوضع النهاري' : 'تبديل إلى الوضع الليلي';
        toggleButtons.forEach(btn => btn.setAttribute('aria-label', label));
    }

    toggle() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        this.addTransitionEffect();
    }

    getCurrentTheme() {
        return document.documentElement.hasAttribute('data-theme') ? 'dark' : 'light';
    }

    addTransitionEffect() {
        const html = document.documentElement;
        html.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        
        setTimeout(() => {
            html.style.transition = '';
        }, 300);
    }
}

function toggleTheme() {
    if (window.themeManager) {
        window.themeManager.toggle();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    // Attach click handlers to theme toggle buttons instead of inline attributes
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.themeManager.toggle();
        });
    });
});
