export function createStars(containerSelector = '.sec', count = 75) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
  
    for (let i = 0; i < count; i++) {
      const star = document.createElement('i');
      star.classList.add('fa-solid', 'fa-star', 'star');
  
      // 랜덤 위치와 크기
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.fontSize = `${Math.random() * 1.5 + 0.5}rem`;
  
      container.appendChild(star);
  
      // 랜덤 깜빡임
      setInterval(() => {
        star.classList.add('animate');
        setTimeout(() => star.classList.remove('animate'), 300);
      }, Math.random() * 2000 + 500);
    }
  }
  