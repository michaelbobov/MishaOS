// Smooth scrolling for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const screenContent = document.querySelector('.screen-content');
            const targetPosition = targetSection.offsetTop - screenContent.offsetTop;
            
            screenContent.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Press 'P' key to toggle position helper outline (for alignment)
let helperVisible = false;
document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
        helperVisible = !helperVisible;
        const monitorScreen = document.querySelector('.monitor-screen');
        if (helperVisible) {
            monitorScreen.style.border = '2px dashed rgba(255, 0, 0, 0.8)';
            monitorScreen.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        } else {
            monitorScreen.style.border = 'none';
            monitorScreen.style.backgroundColor = 'transparent';
        }
    }
});

// Add typing effect to title (optional retro effect)
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing effect on load (optional - can be disabled)
// Uncomment to enable typing effect
/*
window.addEventListener('load', () => {
    const title = document.querySelector('.retro-title');
    const originalText = title.textContent;
    typeWriter(title, originalText, 150);
});
*/

// Add subtle screen curvature effect
document.addEventListener('DOMContentLoaded', () => {
    const screenContent = document.querySelector('.screen-content');
    
    // Add subtle parallax effect on mouse move
    screenContent.addEventListener('mousemove', (e) => {
        const rect = screenContent.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        // Subtle glow effect based on mouse position
        const glowX = (x - 0.5) * 20;
        const glowY = (y - 0.5) * 20;
        
        screenContent.style.boxShadow = `
            inset ${glowX}px ${glowY}px 30px rgba(0, 255, 0, 0.1),
            0 0 40px rgba(0, 255, 0, 0.1)
        `;
    });
});

