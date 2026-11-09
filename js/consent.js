(function () {
  'use strict';
  const measurementId = 'G-2JG9DE1CXG';
  const storageKey = 'goodform.analytics-consent.v1';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  let started = false;
  let choice = null;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  window.gtag('consent', 'default', denied);
  window['ga-disable-' + measurementId] = true;

  function readChoice() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return saved && ['granted', 'denied'].includes(saved.value) && saved.expires > Date.now() && saved.expires <= Date.now() + lifetime ? saved.value : null;
    } catch (_) { return null; }
  }

  function clearAnalyticsCookies() {
    const host = location.hostname.split('.');
    const domains = ['', location.hostname];
    for (let i = 0; i < host.length - 1; i++) domains.push('.' + host.slice(i).join('.'));
    const paths = ['/'];
    const parts = location.pathname.split('/');
    for (let i = 1; i < parts.length; i++) paths.push(parts.slice(0, i + 1).join('/'));
    document.cookie.split(';').forEach(function (cookie) {
      const name = cookie.split('=')[0].trim();
      if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) return;
      domains.forEach(function (domain) {
        paths.forEach(function (path) {
          document.cookie = name + '=; Max-Age=0; path=' + path + (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
        });
      });
    });
  }

  function startAnalytics() {
    if (started) return;
    started = true;
    window['ga-disable-' + measurementId] = false;
    window.gtag('consent', 'update', Object.assign({}, denied, { analytics_storage: 'granted' }));
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: lifetime / 1000,
      cookie_update: false
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(script);
  }

  choice = readChoice();
  if (choice === 'granted') startAnalytics();
  else clearAnalyticsCookies();

  function mount() {
    const panel = document.createElement('section');
    panel.className = 'cookie-panel';
    panel.setAttribute('aria-labelledby', 'cookie-title');
    panel.hidden = choice !== null;
    panel.innerHTML = '<h2 id="cookie-title">Your privacy choices</h2>' +
      '<p class="cookie-current"></p>' +
      '<p>With your permission, we use Google Analytics to understand how visitors use this website. Analytics stays off until you accept. Your choice is saved on this device for six months.</p>' +
      '<p><a href="/privacy.html">Read our privacy policy</a>. You can change your choice at any time using Cookie settings in the footer.</p>' +
      '<div class="cookie-actions"><button type="button" data-choice="denied">Reject analytics</button><button type="button" data-choice="granted">Accept analytics</button></div>';
    const current = panel.querySelector('.cookie-current');
    const notice = document.createElement('div');
    notice.className = 'cookie-notice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.setAttribute('aria-atomic', 'true');
    let noticeTimer;
    let openedFromSettings = false;
    function updateCurrent() {
      current.textContent = choice === 'granted' ? 'Current setting: analytics allowed.' :
        choice === 'denied' ? 'Current setting: analytics rejected.' : 'Current setting: analytics off. No choice saved yet.';
    }
    function showNotice(message) {
      clearTimeout(noticeTimer);
      notice.textContent = message;
      noticeTimer = setTimeout(function () { notice.textContent = ''; }, 5000);
    }
    updateCurrent();
    const settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'cookie-settings';
    settings.textContent = 'Cookie settings';
    settings.setAttribute('aria-controls', 'cookie-panel');
    settings.setAttribute('aria-expanded', String(!panel.hidden));
    panel.id = 'cookie-panel';
    settings.addEventListener('click', function () {
      openedFromSettings = true;
      updateCurrent();
      panel.hidden = !panel.hidden;
      settings.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) panel.querySelector('button').focus();
    });
    panel.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        panel.hidden = true;
        settings.setAttribute('aria-expanded', 'false');
        if (openedFromSettings) settings.focus({ preventScroll: true });
      }
    });
    panel.querySelectorAll('[data-choice]').forEach(function (button) {
      button.addEventListener('click', function () {
        choice = button.dataset.choice;
        let saved = false;
        try {
          localStorage.setItem(storageKey, JSON.stringify({ value: choice, expires: Date.now() + lifetime }));
          saved = true;
        } catch (_) {}
        panel.hidden = true;
        settings.setAttribute('aria-expanded', 'false');
        if (openedFromSettings) settings.focus({ preventScroll: true });
        updateCurrent();
        const message = (choice === 'granted' ? 'Analytics allowed. ' : 'Analytics rejected. ') +
          (saved ? 'Your choice has been saved.' : 'Your browser could not save this choice. It applies to this visit only.');
        showNotice(message);
        if (choice === 'granted') startAnalytics();
        else {
          window['ga-disable-' + measurementId] = true;
          window.gtag('consent', 'update', denied);
          clearAnalyticsCookies();
          // Unload an already running tag so revocation stops all later collection.
          if (started) {
            try { sessionStorage.setItem(storageKey + '.notice', message); } catch (_) {}
            location.reload();
          }
        }
      });
    });
    let footer = document.querySelector('footer .footer-links:last-child') || document.querySelector('footer .footer-links') || document.querySelector('footer');
    if (!footer) {
      footer = document.createElement('footer');
      footer.className = 'cookie-footer';
      document.body.append(footer);
    }
    footer.append(settings);
    document.body.append(panel, notice);
    try {
      const message = sessionStorage.getItem(storageKey + '.notice');
      sessionStorage.removeItem(storageKey + '.notice');
      if (message) showNotice(message);
    } catch (_) {}
    window.addEventListener('storage', function (event) {
      if (event.key !== storageKey && event.key !== null) return;
      const next = readChoice();
      if (next !== 'granted' && started) {
        window['ga-disable-' + measurementId] = true;
        clearAnalyticsCookies();
        location.reload();
      } else {
        choice = next;
        updateCurrent();
        panel.hidden = choice !== null;
        settings.setAttribute('aria-expanded', String(!panel.hidden));
        if (choice === 'granted') startAnalytics();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
