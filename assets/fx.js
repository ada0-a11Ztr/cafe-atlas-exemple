/* Effets de mouvement du site (sans dépendance). Tout est coupé si l'utilisateur demande de réduire les animations. */
(function () {
  var doc = document, de = doc.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- Titres mot à mot et texte qui s'éclaire ---- */
  function wrapWords(el, mode) {
    var txt = (el.getAttribute('data-src') || el.textContent).trim();
    el.setAttribute('data-src', txt);
    el.textContent = '';
    txt.split(/\s+/).forEach(function (w, i, a) {
      if (mode === 'split') {
        var o = doc.createElement('span'); o.className = 'w';
        var n = doc.createElement('span'); n.className = 'wi'; n.style.setProperty('--j', i); n.textContent = w;
        o.appendChild(n); el.appendChild(o);
      } else {
        var s = doc.createElement('span'); s.className = 'sw'; s.textContent = w; el.appendChild(s);
      }
      if (i < a.length - 1) el.appendChild(doc.createTextNode(' '));
    });
  }
  function prep() {
    [].forEach.call(doc.querySelectorAll('[data-split]'), function (el) { el.removeAttribute('data-src'); wrapWords(el, 'split'); observe(el); });
    [].forEach.call(doc.querySelectorAll('[data-scrub]'), function (el) { el.removeAttribute('data-src'); wrapWords(el, 'scrub'); });
    if (reduce) [].forEach.call(doc.querySelectorAll('[data-split]'), function (el) { el.classList.add('in'); });
    scrub();
  }
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.2 }) : null;
  var seen = [];
  function observe(el) { if (seen.indexOf(el) > -1) return; seen.push(el); if (io) io.observe(el); else el.classList.add('in'); }

  /* ---- Défilement : progression, parallaxe, texte qui s'éclaire ---- */
  var prog = doc.querySelector('.prog'), hero = doc.querySelector('.hero'), ticking = false;
  function scrub() {
    var vh = window.innerHeight;
    [].forEach.call(doc.querySelectorAll('[data-scrub]'), function (el) {
      var r = el.getBoundingClientRect(), ws = el.querySelectorAll('.sw');
      var p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.88 - r.top) / (r.height + vh * 0.35)));
      var n = Math.round(p * ws.length);
      for (var i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < n);
    });
  }
  function onScroll() {
    var y = window.pageYOffset || de.scrollTop, max = de.scrollHeight - window.innerHeight;
    if (prog) prog.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    if (hero && !reduce) hero.style.setProperty('--sy', Math.min(y, 800));
    scrub(); ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', scrub);

  /* ---- Halo qui suit le curseur (hero) ---- */
  if (hero && fine && !reduce) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px'); hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ---- Boutons magnétiques ---- */
  if (fine && !reduce) {
    [].forEach.call(doc.querySelectorAll('.btn-gold,.btn-line,.btn-dark'), function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.translate = (x * 8).toFixed(1) + 'px ' + (y * 6).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; });
    });
  }

  /* ---- Galerie : volets qui s'ouvrent ---- */
  [].forEach.call(doc.querySelectorAll('.tile .ph'), function (ph) {
    var s = doc.createElement('i'); s.className = 'slats'; s.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 6; i++) { var sp = doc.createElement('span'); sp.style.setProperty('--s', i); s.appendChild(sp); }
    ph.appendChild(s);
  });

  /* Filet de sécurité : ce qui est déjà à l'écran ne reste jamais caché */
  setTimeout(function () { [].forEach.call(doc.querySelectorAll('[data-reveal],[data-split]'), function (el) { if (!el.classList.contains('in')) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in'); } }); }, 1800);
  window.FX = { refresh: prep };
  prep(); onScroll();
})();
