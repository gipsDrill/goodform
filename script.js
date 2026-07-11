const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.main-nav');

if (menuButton && nav) {
  const menuLabel = menuButton.querySelector('.sr-only');

  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    if (menuLabel) menuLabel.textContent = 'Open menu';
  };

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
    if (menuLabel) menuLabel.textContent = open ? 'Open menu' : 'Close menu';
  });

  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('is-visible'));
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const benefitStrip = document.querySelector('.brand-strip');
const benefitTrack = document.querySelector('.strip-track');
let stripAnimation;
let stripResizeTimer;
let stripOriginalMarkup = benefitTrack ? benefitTrack.innerHTML : '';

function buildBenefitStrip() {
  if (!benefitStrip || !benefitTrack) return;

  if (stripAnimation) stripAnimation.cancel();
  benefitTrack.innerHTML = stripOriginalMarkup;

  // Keep the line wider than every screen so the movement is always visible.
  while (benefitTrack.scrollWidth < benefitStrip.clientWidth + 1100) {
    benefitTrack.insertAdjacentHTML('beforeend', '<b aria-hidden="true">●</b>' + stripOriginalMarkup);
  }

  const travel = Math.max(260, benefitTrack.scrollWidth - benefitStrip.clientWidth);
  // A deliberately calm pace: the line travels to one edge, reverses,
  // then repeats without jumping back to the start.
  const duration = Math.max(52000, Math.min(85000, travel * 32));

  stripAnimation = benefitTrack.animate(
    [
      { transform: 'translate3d(0, 0, 0)' },
      { transform: `translate3d(-${travel}px, 0, 0)` }
    ],
    {
      duration,
      iterations: Infinity,
      direction: 'alternate',
      easing: 'ease-in-out'
    }
  );
}

requestAnimationFrame(buildBenefitStrip);
window.addEventListener('load', buildBenefitStrip, { once: true });
window.addEventListener('resize', () => {
  clearTimeout(stripResizeTimer);
  stripResizeTimer = setTimeout(buildBenefitStrip, 180);
}, { passive: true });
