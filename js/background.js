function createBackgroundDots() {
    const colors = ['#e8f5e9', '#f0f4ff', '#ffd9e9', '#e1f5fe'];
    const dotCount = 15;

    for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        
        const size = Math.random() * 80 + 20;
        const side = Math.random() > 0.5 ? 'left' : 'right';
        const xPos = side === 'left' ? Math.random() * 25 : 75 + Math.random() * 25;
        const yPos = Math.random() * 100;

        // --- UPDATE: Viel schnellere Zeiten ---
        const duration = Math.random() * 4 + 3; // Jetzt zwischen 3s und 7s
        const delay = Math.random() * -5;       // Kleinerer Delay passend zum Tempo

        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        dot.style.left = `${xPos}%`;
        dot.style.top = `${yPos}%`;
        
        dot.style.animationDuration = `${duration}s`;
        dot.style.animationDelay = `${delay}s`;
        
        document.body.appendChild(dot);
    }
}

window.addEventListener('load', createBackgroundDots);