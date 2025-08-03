// Index page functionality
document.addEventListener('DOMContentLoaded', function () {
  // Hamburger menu
  function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
      navMenu.classList.toggle('nav-menu-open');
    }
  }
  window.toggleMenu = toggleMenu;

  // Close menu on link click
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      document.getElementById('navMenu')?.classList.remove('nav-menu-open');
    });
  });

  // Close menu on outside click
  document.addEventListener('click', function (e) {
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.querySelector('.hamburger-menu');
    if (navMenu?.classList.contains('nav-menu-open') &&
        !navMenu.contains(e.target) && !hamburger.contains(e.target)) {
      navMenu.classList.remove('nav-menu-open');
    }
  });

  // Escape key closes menu
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.getElementById('navMenu')?.classList.remove('nav-menu-open');
    }
  });

  // ⭐ Add dynamic stars to the .scene
  function generateSceneStars() {
    const count = 400;
    const scene = document.querySelector('.scene');
    let i = 0;
    while (i < count) {
      const star = document.createElement('i');
      const x = Math.floor(Math.random() * window.innerWidth);
      const y = Math.floor(Math.random() * window.innerHeight);
      const size = Math.random() * 2;
      const duration = 5 + Math.random() * 5;

      star.style.left = `${x}px`;
      star.style.top = `${y}px`;
      star.style.width = `${1 + size}px`;
      star.style.height = `${1 + size}px`;
      star.style.animationDuration = `${duration}s`;
      star.style.animationDelay = `${Math.random() * 5}s`;

      scene.appendChild(star);
      i++;
    }
  }

  generateSceneStars();
});
