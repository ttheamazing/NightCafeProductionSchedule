// Settings management
document.addEventListener('DOMContentLoaded', function() {
    // Default settings
    const defaultSettings = {
        'header-bg-color': '#333333',
        'header-text-color': '#ffffff',
        'body-bg-color': '#f4f4f4',
        'sidebar-bg-color': '#eeeeee',
        'task-bg-color': '#1890ff',
        'task-text-color': '#ffffff'
    };
    
    // Load saved settings from localStorage
    let currentSettings = JSON.parse(localStorage.getItem('ganttChartSettings')) || {};
    
    // Apply saved settings on page load
    applySettings(currentSettings);
    
    // Initialize color pickers with current values
    function initializeColorPickers() {
        for (const [key, defaultValue] of Object.entries(defaultSettings)) {
            const picker = document.getElementById(key);
            if (picker) {
                picker.value = currentSettings[key] || defaultValue;
            }
        }
    }
    
    // Apply settings to the page
    function applySettings(settings) {
        // Apply header background color
        if (settings['header-bg-color']) {
            document.querySelector('header').style.backgroundColor = settings['header-bg-color'];
        }
        
        // Apply header text color
        if (settings['header-text-color']) {
            document.querySelector('header').style.color = settings['header-text-color'];
            document.querySelectorAll('header button').forEach(button => {
                if (!button.classList.contains('active')) {
                    button.style.backgroundColor = adjustBrightness(settings['header-bg-color'], 20);
                    button.style.color = settings['header-text-color'];
                }
            });
        }
        
        // Apply body background color
        if (settings['body-bg-color']) {
            document.body.style.backgroundColor = settings['body-bg-color'];
        }
        
        // Apply sidebar background color
        if (settings['sidebar-bg-color']) {
            document.querySelector('.sidebar').style.backgroundColor = settings['sidebar-bg-color'];
        }
        
        // Apply task colors to all existing tasks
        if (settings['task-bg-color']) {
            document.querySelectorAll('.scheduled-task').forEach(task => {
                task.style.backgroundColor = settings['task-bg-color'];
            });
        }
        
        // Apply task text color
        if (settings['task-text-color']) {
            document.querySelectorAll('.scheduled-task').forEach(task => {
                task.style.color = settings['task-text-color'];
            });
        }
    }
    
    // Settings button click handler
    document.getElementById('settings-btn').addEventListener('click', function() {
        const modal = document.getElementById('settings-modal');
        modal.style.display = 'block';
        initializeColorPickers();
    });
    
    // Close settings modal
    document.querySelector('.close-settings-modal').addEventListener('click', function() {
        document.getElementById('settings-modal').style.display = 'none';
    });
    
    // Reset individual color
    document.querySelectorAll('.reset-color').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const defaultValue = this.getAttribute('data-default');
            const picker = document.getElementById(targetId);
            
            if (picker && defaultValue) {
                picker.value = defaultValue;
            }
        });
    });
    
    // Reset all settings
    document.getElementById('reset-all-settings-btn').addEventListener('click', function() {
        // Reset all color pickers to defaults
        for (const [key, defaultValue] of Object.entries(defaultSettings)) {
            const picker = document.getElementById(key);
            if (picker) {
                picker.value = defaultValue;
            }
        }
    });
    
    // Save settings
    document.getElementById('save-settings-btn').addEventListener('click', function() {
        // Collect all settings
        const newSettings = {};
        for (const key of Object.keys(defaultSettings)) {
            const picker = document.getElementById(key);
            if (picker) {
                newSettings[key] = picker.value;
            }
        }
        
        // Save to localStorage
        localStorage.setItem('ganttChartSettings', JSON.stringify(newSettings));
        
        // Apply the new settings
        currentSettings = newSettings;
        applySettings(currentSettings);
        
        // Close the modal
        document.getElementById('settings-modal').style.display = 'none';
    });
    
    // Helper function to adjust color brightness
    function adjustBrightness(color, percent) {
        let R = parseInt(color.substring(1,3), 16);
        let G = parseInt(color.substring(3,5), 16);
        let B = parseInt(color.substring(5,7), 16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R < 255) ? R : 255;
        G = (G < 255) ? G : 255;
        B = (B < 255) ? B : 255;

        const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
        const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
        const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

        return "#" + RR + GG + BB;
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('settings-modal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
});