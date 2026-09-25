(() => {
  const frame = document.getElementById('appFrame');
  const phone = document.getElementById('phone');
  const size = document.getElementById('phoneSize');
  const stage = document.querySelector('.simulator-stage');
  const mobile = matchMedia('(max-width: 600px)');

  function setTheme(theme, save = false) {
    const value = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = value;
    document.querySelectorAll('button[data-theme]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.theme === value));
    });
    document.querySelector('meta[name="theme-color"]').content = value === 'dark' ? '#111111' : '#ffffff';
    if (save) {
      try { localStorage.setItem('harpex-theme', value); } catch {}
      frame.contentWindow.postMessage({ type: 'harpex-simulator', action: 'theme', theme: value }, location.origin);
    }
  }

  function fitPhone() {
    if (mobile.matches) {
      phone.style.transform = '';
      size.style.width = '';
      size.style.height = '';
      return;
    }
    const scale = Math.min(1, (stage.clientHeight - 24) / 864, (stage.clientWidth - 40) / 410);
    phone.style.transform = `scale(${Math.max(.1, scale)})`;
    size.style.width = `${410 * scale}px`;
    size.style.height = `${864 * scale}px`;
  }

  document.querySelectorAll('button[data-theme]').forEach(button => {
    button.addEventListener('click', () => setTheme(button.dataset.theme, true));
  });
  document.getElementById('openOnboarding').addEventListener('click', () => {
    frame.contentWindow.postMessage({ type: 'harpex-simulator', action: 'onboarding' }, location.origin);
  });
  document.getElementById('phoneHome').addEventListener('click', () => {
    frame.contentWindow.postMessage({ type: 'harpex-simulator', action: 'home' }, location.origin);
  });
  window.addEventListener('storage', event => {
    if (event.key === 'harpex-theme') setTheme(event.newValue);
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'harpex-theme') {
      setTheme(event.data.theme);
      document.querySelector('.phone-screen').dataset.view = event.data.view === 'onboarding' ? 'onboarding' : 'app';
    }
  });
  const updateTime = () => {
    document.getElementById('phoneTime').textContent = new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  };
  updateTime();
  setInterval(updateTime, 60000);
  new ResizeObserver(fitPhone).observe(stage);
  mobile.addEventListener('change', fitPhone);
  setTheme(document.documentElement.dataset.theme);
  fitPhone();
})();
