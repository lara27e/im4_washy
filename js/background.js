function createBackgroundDots() {
    const colors = ['#e8f5e9', '#f0f4ff', '#ffd9e9', '#e1f5fe']; // Pastelltöne
    const dotCount = 15;

    for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        
        // Zufällige Größe zwischen 20px und 100px
        const size = Math.random() * 80 + 20;
        
        // Positionierung: Fokus auf die Ränder (0-20% oder 80-100% des Bildschirms)
        const side = Math.random() > 0.5 ? 'left' : 'right';
        const xPos = side === 'left' ? Math.random() * 20 : 80 + Math.random() * 20;
        const yPos = Math.random() * 100;

        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        dot.style.left = `${xPos}%`;
        dot.style.top = `${yPos}%`;
        
        document.body.appendChild(dot);
    }
}

// Ausführen, wenn die Seite geladen ist
window.addEventListener('load', createBackgroundDots);