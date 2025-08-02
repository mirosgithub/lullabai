// Index page functionality
document.addEventListener('DOMContentLoaded', function () {
  // Hamburger menu functionality
  function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
      navMenu.classList.toggle('nav-menu-open');
    }
  }

  // Make toggleMenu function globally available
  window.toggleMenu = toggleMenu;

  // Close menu when clicking on a nav link
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      const navMenu = document.getElementById('navMenu');
      if (navMenu) {
        navMenu.classList.remove('nav-menu-open');
      }
    });
  });

  // Close menu when clicking outside of it
  document.addEventListener('click', function(event) {
    const navMenu = document.getElementById('navMenu');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    
    if (navMenu && navMenu.classList.contains('nav-menu-open')) {
      if (!navMenu.contains(event.target) && !hamburgerMenu.contains(event.target)) {
        navMenu.classList.remove('nav-menu-open');
      }
    }
  });

  // Close menu when pressing Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      const navMenu = document.getElementById('navMenu');
      if (navMenu && navMenu.classList.contains('nav-menu-open')) {
        navMenu.classList.remove('nav-menu-open');
      }
    }
  });
}); 