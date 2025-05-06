// Theme Manager for E-LibraryAI
// This script handles theme switching functionality

// Theme configuration with CSS variables
const themes = {
    dark: {
        '--bg-color': '#1a1a1a',
        '--secondary-bg': '#242424',
        '--tertiary-bg': '#333',
        '--text-color': '#ffffff',
        '--secondary-text': '#cccccc',
        '--border-color': '#444',
        '--highlight-color': '#1a73e8',
        '--card-bg': '#242424',
        '--sidebar-bg': '#242424',
        '--button-bg': '#333'
    },
    light: {
        '--bg-color': '#f5f5f5',
        '--secondary-bg': '#ffffff',
        '--tertiary-bg': '#e0e0e0',
        '--text-color': '#333333',
        '--secondary-text': '#666666',
        '--border-color': '#dddddd',
        '--highlight-color': '#1a73e8',
        '--card-bg': '#ffffff',
        '--sidebar-bg': '#ffffff',
        '--button-bg': '#e0e0e0'
    },
    sepia: {
        '--bg-color': '#f4ecd8',
        '--secondary-bg': '#e8dcb5',
        '--tertiary-bg': '#d8cca3',
        '--text-color': '#5b4636',
        '--secondary-text': '#7d6045',
        '--border-color': '#d0c49f',
        '--highlight-color': '#986841',
        '--card-bg': '#e8dcb5',
        '--sidebar-bg': '#e8dcb5',
        '--button-bg': '#d8cca3'
    }
};

// Function to initialize theme
function initThemeManager() {
    console.log('Initializing theme manager...');
    
    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('e-libraryai-theme') || 'dark';
    applyTheme(savedTheme);
    
    // Set theme selector to current theme if it exists
    const themeSelector = document.querySelector('select[name="theme"]') || document.getElementById('themeSelector');
    if (themeSelector) {
        console.log('Theme selector found, setting to', savedTheme);
        themeSelector.value = savedTheme;
        
        // Add event listener for theme changes
        themeSelector.addEventListener('change', function() {
            applyTheme(this.value);
        });
    }
    
    // Add theme toggle buttons if they exist
    const themeToggleButtons = document.querySelectorAll('[data-theme-toggle]');
    themeToggleButtons.forEach(button => {
        const themeName = button.getAttribute('data-theme-toggle');
        if (themeName && themes[themeName]) {
            button.addEventListener('click', () => {
                applyTheme(themeName);
                
                // Update theme selector if it exists
                if (themeSelector) {
                    themeSelector.value = themeName;
                }
            });
            
            // Highlight the current theme's button
            if (savedTheme === themeName) {
                button.classList.add('active-theme');
            }
        }
    });
}

// Function to apply theme
function applyTheme(themeName) {
    console.log('Setting theme to', themeName);
    
    // Validate theme name
    if (!themes[themeName]) {
        console.error('Invalid theme:', themeName);
        themeName = 'dark'; // Default to dark if invalid
    }
    
    // Save theme preference
    localStorage.setItem('e-libraryai-theme', themeName);
    
    // Apply theme variables to document root
    const root = document.documentElement;
    
    // Apply CSS variables from theme
    for (const [property, value] of Object.entries(themes[themeName])) {
        root.style.setProperty(property, value);
    }
    
    // Set data attribute for theme-specific selectors
    document.body.setAttribute('data-theme', themeName);
    
    // Update theme toggle buttons
    const themeToggleButtons = document.querySelectorAll('[data-theme-toggle]');
    themeToggleButtons.forEach(button => {
        if (button.getAttribute('data-theme-toggle') === themeName) {
            button.classList.add('active-theme');
        } else {
            button.classList.remove('active-theme');
        }
    });
    
    // Update UI elements if needed
    updateUIForTheme(themeName);

    // Dispatch event for other components to react to theme change
    const themeChangeEvent = new CustomEvent('themeChanged', { detail: { theme: themeName } });
    document.dispatchEvent(themeChangeEvent);
}

// Additional UI updates for theme
function updateUIForTheme(themeName) {
    // Update any specific UI elements that need theme-specific treatment
    const logo = document.querySelector('.logo img');
    if (logo) {
        if (themeName === 'light') {
            logo.style.filter = 'brightness(0.8)';
        } else if (themeName === 'sepia') {
            logo.style.filter = 'sepia(0.5)';
        } else {
            logo.style.filter = 'none';
        }
    }
    
    // Update buttons or other elements
    const buttons = document.querySelectorAll('.action-btn, .button');
    buttons.forEach(button => {
        if (themeName === 'light' && !button.classList.contains('continue-btn')) {
            button.style.color = '#333333';
        } else {
            button.style.color = '';
        }
    });
    
    // Update chat messages for better contrast
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
        if (themeName === 'light') {
            message.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        } else {
            message.style.boxShadow = 'none';
        }
    });
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initThemeManager);

// Handle dynamic content loading
document.addEventListener('contentLoaded', function() {
    console.log('Content dynamically loaded, updating theme elements');
    const currentTheme = localStorage.getItem('e-libraryai-theme') || 'dark';
    updateUIForTheme(currentTheme);
});

document.addEventListener('DOMContentLoaded', function () {
    const fontSizeSelector = document.getElementById('fontSizeSelector');

    fontSizeSelector.addEventListener('change', function () {
        const selectedSize = fontSizeSelector.value;
        let fontSizeValue;

        switch (selectedSize) {
            case 'small':
                fontSizeValue = '12px';
                break;
            case 'medium':
                fontSizeValue = '16px';
                break;
            case 'large':
                fontSizeValue = '20px';
                break;
            default:
                fontSizeValue = '16px';
        }

        document.body.style.fontSize = fontSizeValue;
    });
});

// Export functions for external use
window.setTheme = applyTheme;