// Enhanced Photo Upload Functions
function updatePhotoLabel(inputId, fileName) {
    const input = document.getElementById(inputId);
    const label = input.nextElementSibling;
    const textElement = label.querySelector('.file-upload-text div');
    
    if (textElement) {
        textElement.textContent = `تم اختيار: ${fileName}`;
    }
}

function setupPhotoDragAndDrop(inputId, previewId) {
    const input = document.getElementById(inputId);
    const label = input.nextElementSibling;
    
    if (!label) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        label.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        label.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        label.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
        label.style.borderColor = 'var(--primary-red)';
        label.style.background = 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(183, 28, 28, 0.05) 100%)';
    }
    
    function unhighlight(e) {
        label.style.borderColor = 'var(--secondary-blue)';
        label.style.background = 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(13, 71, 161, 0.02) 100%)';
    }
    
    label.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            input.files = files;
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        }
    }
}

// Initialize photo upload when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Setup will be called from admin.js event listeners
});

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.updatePhotoLabel = updatePhotoLabel;
    window.setupPhotoDragAndDrop = setupPhotoDragAndDrop;
}
