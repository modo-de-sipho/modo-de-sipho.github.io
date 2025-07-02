document.addEventListener('DOMContentLoaded', () => {

  const cursor = document.querySelector('.custom-cursor');
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = (e.clientX - 10) + 'px';
    cursor.style.top = (e.clientY - 10) + 'px';
  });

  const createParticles = () => {
    const container = document.querySelector('.particles');
    const types = ['type1', 'type2', 'type3'];

    setInterval(() => {
      const p = document.createElement('div');
      p.className = `particle ${types[Math.floor(Math.random() * types.length)]}`;
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 2 + 's';
      container.appendChild(p);
      setTimeout(() => p.remove(), 20000);
    }, 100);
  };

  const createConnections = () => {
    const container = document.querySelector('.connections');

    setInterval(() => {
      const line = document.createElement('div');
      line.className = 'connection-line';
      line.style.top = Math.random() * 100 + '%';
      line.style.width = Math.random() * 300 + 100 + 'px';
      line.style.animationDelay = Math.random() * 2 + 's';
      line.style.transform = `rotate(${Math.random() * 360}deg)`;
      container.appendChild(line);
      setTimeout(() => line.remove(), 8000);
    }, 500);
  };

  const createMatrixEffect = () => {
    const container = document.querySelector('.matrix-effect');
    const chars = '01SIPHO01GAMER01MINECRAFT01';

    setInterval(() => {
      const char = document.createElement('div');
      char.className = 'matrix-char';
      char.textContent = chars[Math.floor(Math.random() * chars.length)];
      char.style.left = Math.random() * 100 + '%';
      char.style.animationDelay = Math.random() * 2 + 's';
      container.appendChild(char);
      setTimeout(() => char.remove(), 10000);
    }, 150);
  };

  document.addEventListener('click', (e) => {
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: #00ff99;
        border-radius: 50%;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        pointer-events: none;
        z-index: 9999;
        animation: explode 1s ease-out forwards;
      `;

      const angle = (Math.PI * 2 * i) / 20;
      const velocity = Math.random() * 100 + 50;
      particle.style.setProperty('--x', Math.cos(angle) * velocity + 'px');
      particle.style.setProperty('--y', Math.sin(angle) * velocity + 'px');

      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }
  });

  const scanAnimation = () => {
    const buttons = document.querySelectorAll('.button');
    buttons.forEach(button => {
      const scanLine = document.createElement('div');
      scanLine.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, transparent, #00ff99, transparent);
        animation: scan 3s infinite;
        pointer-events: none;
      `;
      button.appendChild(scanLine);
    });
  };

  createParticles();
  createConnections();
  createMatrixEffect();
  scanAnimation();

});
