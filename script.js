
const cursor = document.querySelector('.custom-cursor');
document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX - 10 + 'px';
  cursor.style.top = e.clientY - 10 + 'px';
});

function createHyperParticles() {
  const container = document.querySelector('.particles');
  const types = ['type1', 'type2', 'type3'];
  
  setInterval(() => {
    const particle = document.createElement('div');
    particle.className = `particle ${types[Math.floor(Math.random() * types.length)]}`;
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 2 + 's';
    container.appendChild(particle);
    
    setTimeout(() => particle.remove(), 20000);
  }, 100);
}

function createConnections() {
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
}

function createMatrixEffect() {
  const container = document.querySelector('.matrix-effect');
  const chars = '01SIPHO01GAMER01MINECRAFT01';
  
  setInterval(() => {
    const char = document.createElement('div');
    char.className = 'matrix-char';
    char.textContent = chars[Math.floor(Math.random() * chars.length)];
    char.style.left = Math.random() * 100 + '%';
    char.style.animationDelay = Math.random() * 2 + 's';
    char.style.fontSize = Math.random() * 8 + 8 + 'px';
    container.appendChild(char);
    
    setTimeout(() => char.remove(), 10000);
  }, 150);
}

function randomShake() {
  const title = document.querySelector('h1');
  
  setInterval(() => {
    if (Math.random() < 0.05) {
      title.style.animation = 'none';
      setTimeout(() => {
        title.style.animation = 'rainbowText 3s ease-in-out infinite, breathe 4s ease-in-out infinite, shake 0.5s ease-in-out infinite';
      }, 100);
    }
  }, 1000);
}

function createExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      width: 4px;
      height: 4px;
      background: #00ff99;
      border-radius: 50%;
      left: ${x}px;
      top: ${y}px;
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
}

function continuousTypeWriter() {
  const buttons = document.querySelectorAll('.button-text');
  
  function typeButton(button, index) {
    const originalText = button.getAttribute('data-text');
    const isHTML = originalText.includes('<svg');
    
    setTimeout(() => {
      if (isHTML) {
        const textPart = ' Mon Discord';
        const svgPart = originalText.substring(0, originalText.indexOf(' Mon Discord'));
        
        button.innerHTML = svgPart;
        button.style.borderRight = '2px solid #00ff99';
        
        let charIndex = 0;
        const typeInterval = setInterval(() => {
          if (charIndex < textPart.length) {
            button.innerHTML = svgPart + textPart.substring(0, charIndex + 1);
            charIndex++;
          } else {
            clearInterval(typeInterval);
            setTimeout(() => {
              button.style.borderRight = 'none';
              setTimeout(() => typeButton(button, index), 3000);
            }, 500);
          }
        }, 100);
      } else {
        button.textContent = '';
        button.style.borderRight = '2px solid #00ff99';
        
        let charIndex = 0;
        const typeInterval = setInterval(() => {
          if (charIndex < originalText.length) {
            button.textContent += originalText.charAt(charIndex);
            charIndex++;
          } else {
            clearInterval(typeInterval);
            setTimeout(() => {
              button.style.borderRight = 'none';
              setTimeout(() => typeButton(button, index), 3000);
            }, 500);
          }
        }, 100);
      }
    }, index * 1000 + 3000);
  }
  
  buttons.forEach((button, index) => {
    typeButton(button, index);
  });
}

function decodeButtons() {
  const buttons = document.querySelectorAll('.button-text');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  buttons.forEach((button, index) => {
    const originalText = button.getAttribute('data-text');
    const isHTML = originalText.includes('<svg');
    
    button.addEventListener('mouseenter', () => {
      if (!isHTML) {
        let iterations = 0;
        const decodeInterval = setInterval(() => {
          button.textContent = button.textContent
            .split('')
            .map((char, charIndex) => {
              if (charIndex < iterations) {
                return originalText[charIndex];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('');
            
          if (iterations >= originalText.length) {
            clearInterval(decodeInterval);
          }
          
          iterations += 1/3;
        }, 30);
      }
    });
    
    button.addEventListener('mouseleave', () => {
      if (isHTML) {
        button.innerHTML = originalText;
      } else {
        button.textContent = originalText;
      }
    });
  });
}

function scanAnimation() {
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
}

let scrollTimeout;
window.addEventListener('scroll', () => {
  document.body.style.filter = 'hue-rotate(90deg) saturate(1.5)';
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    document.body.style.filter = 'none';
  }, 200);
});

function globalGlitch() {
  setInterval(() => {
    if (Math.random() < 0.02) {
      document.body.style.filter = 'hue-rotate(180deg) invert(0.1) contrast(1.2)';
      setTimeout(() => {
        document.body.style.filter = 'none';
      }, 150);
    }
  }, 1000);
}

function binaryRain() {
  setInterval(() => {
    const binary = document.createElement('div');
    binary.style.cssText = `
      position: fixed;
      color: rgba(0, 255, 153, 0.3);
      font-family: monospace;
      font-size: 14px;
      left: ${Math.random() * 100}%;
      top: -20px;
      z-index: 1;
      animation: fall 8s linear infinite;
      pointer-events: none;
    `;
    binary.textContent = Math.random() > 0.5 ? '1' : '0';
    document.body.appendChild(binary);
    
    setTimeout(() => binary.remove(), 8000);
  }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
  createHyperParticles();
  createConnections();
  createMatrixEffect();
  randomShake();
  continuousTypeWriter();
  decodeButtons();
  scanAnimation();
  globalGlitch();
  binaryRain();
  
  const buttons = document.querySelectorAll('.button');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-15px) scale(1.1) rotateY(10deg)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
    });
  });
});

document.addEventListener('click', (e) => {
  createExplosion(e.clientX, e.clientY);
});
