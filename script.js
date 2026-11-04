const menuButton = document.querySelector('.menu-button');
const siteNav = document.querySelector('.site-nav');

const setMenuOpen = (open) => {
  menuButton.setAttribute('aria-expanded', String(open));
  siteNav.classList.toggle('open', open);
};
const isMenuOpen = () => siteNav.classList.contains('open');

menuButton.addEventListener('click', () => setMenuOpen(!isMenuOpen()));

document.addEventListener('click', (event) => {
  if (!isMenuOpen() || menuButton.contains(event.target)) return;
  if (event.target.closest('a') || !siteNav.contains(event.target)) setMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isMenuOpen()) {
    setMenuOpen(false);
    menuButton.focus();
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();
