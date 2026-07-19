(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const form = document.querySelector('.quote-form');
  const status = document.querySelector('.form-status');
  if (form && status) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const requiredFields = [...form.querySelectorAll('[required]')];
      const invalid = requiredFields.find((field) => !field.value.trim());

      if (invalid) {
        status.textContent = 'Please complete your name and email address.';
        invalid.focus();
        return;
      }

      status.textContent = 'Thank you — this is a concept form, so no message was sent.';
      form.reset();
    });
  }
})();
