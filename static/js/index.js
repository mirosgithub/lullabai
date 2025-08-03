// Index page functionality
document.addEventListener('DOMContentLoaded', function () {
  // Only run splash screen animation on index page (when splash element exists)
  const splash = document.getElementById('splash');
  const mainContent = document.getElementById('main-content');
  
  if (splash && mainContent) {
    // Splash Screen Animation
    function startSplashAnimation() {
      // Start with fade-in effect
      setTimeout(() => {
        splash.classList.add('fade-in');
      }, 100);

      // Show splash for 2.5 seconds, then fade out over 1 second
      setTimeout(() => {
        splash.classList.add('fade-out');
        
        // After fade out completes (1 second), hide splash and show main content
        setTimeout(() => {
          splash.style.display = 'none';
          mainContent.classList.add('show');
          
          // Add fade-in effect to individual elements after a brief delay
          setTimeout(() => {
            const scene = document.querySelector('.scene');
            const introHeader = document.querySelector('.intro-header');
            const container = document.querySelector('.container');
            const sec = document.querySelector('.sec');
            
            if (scene) scene.classList.add('fade-in');
            if (introHeader) introHeader.classList.add('fade-in');
            if (container) container.classList.add('fade-in');
            if (sec) sec.classList.add('fade-in');
          }, 100);
        }, 1000);
      }, 2500);
    }

    // Start the splash animation
    startSplashAnimation();
  }

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

  // ⭐ Add dynamic stars to the .scene - Only on index page
  function generateSceneStars() {
    const scene = document.querySelector('.scene');
    if (scene) {
      const count = 400;
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
  }

  generateSceneStars();
});
