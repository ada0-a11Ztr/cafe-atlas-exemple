/* Café Atlas — comportement du site (sans dépendance, sans collecte de données) */
(function () {
  var D = window.I18N, CFG = window.CFG, doc = document, de = doc.documentElement;
  var lang = 'fr';
  try { lang = localStorage.getItem('lang') || 'fr'; } catch (e) {}
  var qm = location.search.match(/[?&]lang=(fr|ar|en)/); if (qm) lang = qm[1];
  if (!{ fr: 1, ar: 1, en: 1 }[lang]) lang = 'fr';
  var IDX = { fr: 0, ar: 1, en: 2 };
  function t(k) { return D[k] ? D[k][IDX[lang]] : ''; }

  /* ---- Langues ---- */
  function applyLang() {
    de.lang = lang; de.dir = lang === 'ar' ? 'rtl' : 'ltr';
    [].forEach.call(doc.querySelectorAll('[data-i18n]'), function (el) { if (D[el.getAttribute('data-i18n')]) el.textContent = t(el.getAttribute('data-i18n')); });
    [].forEach.call(doc.querySelectorAll('[data-i18n-aria]'), function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    var m = doc.querySelector('meta[data-i18n-meta]'); if (m) m.setAttribute('content', t(m.getAttribute('data-i18n-meta')));
    [].forEach.call(doc.querySelectorAll('[data-lang]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); });
    setWa(); status(); lbRefresh(); if (window.FX) FX.refresh();
  }
  [].forEach.call(doc.querySelectorAll('[data-lang]'), function (b) {
    b.addEventListener('click', function () { lang = b.getAttribute('data-lang'); try { localStorage.setItem('lang', lang); } catch (e) {} applyLang(); });
  });

  /* ---- WhatsApp : message prérempli dans la langue choisie ---- */
  function setWa() {
    var url = 'https://wa.me/' + CFG.phone + '?text=' + encodeURIComponent(t('wa_hello'));
    [].forEach.call(doc.querySelectorAll('a[data-wa]'), function (a) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; });
  }

  /* ---- Ouvert / fermé (heure du Maroc) ---- */
  function now() {
    var p = new Intl.DateTimeFormat('en-GB', { timeZone: CFG.tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
    var day = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[o.weekday];
    return { day: day, min: (+o.hour % 24) * 60 + (+o.minute) };
  }
  function toMin(s) { var a = s.split(':'); return (+a[0]) * 60 + (+a[1]); }
  function status() {
    var n; try { n = now(); } catch (e) { return; }
    var h = CFG.hours[n.day], open = n.min >= toMin(h[0]) && n.min < toMin(h[1]);
    var txt = open ? t('open_now') + ' · ' + t('until') + ' ' + h[1] : t('closed_now') + (n.min < toMin(h[0]) ? ' · ' + t('opens_at') + ' ' + h[0] : '');
    [].forEach.call(doc.querySelectorAll('.js-status'), function (el) { el.removeAttribute('data-i18n'); el.textContent = txt; });
    [].forEach.call(doc.querySelectorAll('.status'), function (el) { el.classList.toggle('is-open', open); el.classList.toggle('is-closed', !open); });
    [].forEach.call(doc.querySelectorAll('.hrs tr'), function (tr) { tr.classList.toggle('today', +tr.getAttribute('data-day') === n.day); });
  }

  /* ---- Menu mobile ---- */
  var burger = doc.getElementById('burger'), nav = doc.getElementById('nav');
  if (burger) burger.addEventListener('click', function () { var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o ? 'true' : 'false'); });

  /* ---- Apparition au défilement ---- */
  var rev = [].slice.call(doc.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('in'); }); }

  /* ---- Carte : filtre par catégorie ---- */
  var chips = doc.querySelectorAll('.chip');
  [].forEach.call(chips, function (c) {
    c.addEventListener('click', function () {
      var f = c.getAttribute('data-f');
      [].forEach.call(chips, function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      [].forEach.call(doc.querySelectorAll('.mcat'), function (m) { m.classList.toggle('hide', f !== 'all' && m.getAttribute('data-c') !== f); });
    });
  });

  /* ---- Galerie : visionneuse ---- */
  var lb = doc.getElementById('lb'), cur = 1, N = 8;
  function lbRefresh() { if (!lb) return; var cap = doc.getElementById('lb-cap'); if (cap) cap.textContent = t('g' + cur); }
  function lbShow(n) { cur = ((n - 1 + N) % N) + 1; var ph = doc.getElementById('lb-ph'); var tl = doc.querySelectorAll('[data-lb]')[cur - 1]; ph.src = tl ? tl.getAttribute('data-src') : ''; ph.alt = t('g' + cur); lbRefresh(); }
  if (lb) {
    var lastFocus = null;
    function open(n) { lastFocus = doc.activeElement; lb.hidden = false; lbShow(n); setTimeout(function () { lb.classList.add('on'); doc.getElementById('lb-x').focus(); }, 20); }
    function close() { lb.classList.remove('on'); setTimeout(function () { lb.hidden = true; if (lastFocus) lastFocus.focus(); }, 200); }
    [].forEach.call(doc.querySelectorAll('[data-lb]'), function (b) { b.addEventListener('click', function () { open(+b.getAttribute('data-lb')); }); });
    doc.getElementById('lb-x').addEventListener('click', close);
    doc.getElementById('lb-p').addEventListener('click', function () { lbShow(cur - 1); });
    doc.getElementById('lb-nx').addEventListener('click', function () { lbShow(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    doc.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') lbShow(cur + (de.dir === 'rtl' ? -1 : 1));
      if (e.key === 'ArrowLeft') lbShow(cur + (de.dir === 'rtl' ? 1 : -1));
    });
  }

  /* ---- Formulaire : ouvre WhatsApp avec le message (aucune donnée envoyée à un serveur) ---- */
  var form = doc.getElementById('book');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements, err = doc.getElementById('err');
    if (!f.name.value.trim()) { err.hidden = false; f.name.focus(); return; }
    err.hidden = true;
    var msg = t('wa_msg').replace('{name}', f.name.value.trim()).replace('{date}', f.date.value || '—').replace('{time}', f.time.value || '—').replace('{guests}', f.guests.value || '—').replace('{msg}', f.msg.value.trim());
    window.open('https://wa.me/' + CFG.phone + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });

  applyLang();
  setInterval(status, 60000);
})();
