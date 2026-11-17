/* Café Atlas v3 : entrée de page, bandeau défilant, onglets de la carte, rail, parallaxe.
   Tout le mouvement s'arrête si l'utilisateur demande de réduire les animations. */
(function () {
  var doc = document, de = doc.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function t(k) { var D = window.I18N || {}, i = { fr: 0, ar: 1, en: 2 }[de.lang] || 0; return D[k] ? D[k][i] : ''; }
  function onLang(fn) { new MutationObserver(fn).observe(de, { attributes: true, attributeFilter: ['lang', 'dir'] }); }
  var isRtl = function () { return de.dir === 'rtl'; };

  /* ---- Entrée de page ---- */
  [].forEach.call(doc.querySelectorAll('.sgh h1 .ln>span'), function (s, j) { s.style.setProperty('--j', j); });
  function ready() { de.classList.add('ready'); }
  if (doc.fonts && doc.fonts.ready) { doc.fonts.ready.then(function () { setTimeout(ready, 60); }); setTimeout(ready, 1200); } else { setTimeout(ready, 100); }

  /* ---- Pause : arrête le diaporama et le bandeau ; pause automatique au survol ou au clavier ---- */
  var pb = doc.querySelector('.sgh-pause'), hero = doc.querySelector('.sgh');
  function pauseLabel() { if (pb) pb.setAttribute('aria-label', t(de.classList.contains('paused') ? 'play_l' : 'pause_l')); }
  if (pb) {
    pb.addEventListener('click', function () {
      var p = de.classList.toggle('paused');
      pb.setAttribute('aria-pressed', p ? 'true' : 'false'); pauseLabel();
      if (!p) window.dispatchEvent(new Event('motionresume'));
    });
    onLang(function () { setTimeout(pauseLabel, 0); });
  }
  if (hero) {
    var panel = hero.querySelector('.sgh-panel');
    if (panel) { panel.addEventListener('mouseenter', function () { hero.classList.add('hold'); }); panel.addEventListener('mouseleave', function () { hero.classList.remove('hold'); }); }
    hero.addEventListener('focusin', function () { hero.classList.add('hold'); });
    hero.addEventListener('focusout', function () { hero.classList.remove('hold'); });
  }

  /* ---- Bandeau défilant : accélère et penche avec la vitesse du défilement ---- */
  var mq = doc.querySelector('.mq-t');
  if (mq && !reduce) {
    var x = 0, boost = 0, lastY = window.pageYOffset, lastT = 0, running = false, visible = true, hover = false;
    mq.parentNode.addEventListener('mouseenter', function () { hover = true; });
    mq.parentNode.addEventListener('mouseleave', function () { hover = false; start(); });
    window.addEventListener('motionresume', function () { start(); });
    function loop(ts) {
      if (!running) return;
      if (de.classList.contains('paused') || hover) { running = false; return; }
      var dt = lastT ? Math.min(64, ts - lastT) / 1000 : 0; lastT = ts;
      var half = mq.scrollWidth / 2;
      x -= (60 + boost) * dt;
      if (half && x <= -half) x += half;
      boost *= 0.92;
      mq.style.setProperty('--x', x.toFixed(1) + 'px');
      mq.style.setProperty('--sk', Math.max(-10, Math.min(10, -boost / 60)).toFixed(2) + 'deg');
      requestAnimationFrame(loop);
    }
    function start() { if (running || !visible || hover || de.classList.contains('paused')) return; running = true; lastT = 0; requestAnimationFrame(loop); }
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset; boost = Math.min(900, boost + Math.abs(y - lastY) * 3); lastY = y;
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); else running = false; }).observe(mq.parentNode);
    } else { start(); }
  }

  /* ---- Carte : onglets avec point qui glisse, cartes qui se réorganisent ---- */
  var tabs = doc.querySelector('.tabs');
  if (tabs) {
    var btns = [].slice.call(tabs.querySelectorAll('button')), dot = tabs.querySelector('.tdot');
    var cards = [].slice.call(doc.querySelectorAll('.pc'));
    function placeDot() {
      var on = tabs.querySelector('[aria-pressed="true"]'); if (!on || !dot) return;
      var r = on.getBoundingClientRect(), p = tabs.getBoundingClientRect();
      dot.style.setProperty('--tx', (r.left - p.left + r.width / 2 - 4).toFixed(1) + 'px');
    }
    function filter(f) {
      cards.forEach(function (c) {
        var show = f === 'all' || c.getAttribute('data-cat') === f, v = (c._v = (c._v || 0) + 1);
        if (reduce) { c.classList.toggle('gone', !show); c.classList.remove('out'); return; }
        if (show) {
          if (c.classList.contains('gone')) { c.classList.remove('gone'); c.classList.add('out'); }
          setTimeout(function () { if (c._v === v) c.classList.remove('out'); }, 40);
        } else {
          c.classList.add('out');
          setTimeout(function () { if (c._v === v) c.classList.add('gone'); }, 380);
        }
      });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        placeDot(); filter(b.getAttribute('data-f'));
      });
    });
    window.addEventListener('resize', placeDot);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(placeDot);
    onLang(function () { setTimeout(placeDot, 30); });
    placeDot();
  }

  /* ---- « Commander » : message WhatsApp prérempli avec le produit, dans la langue choisie ---- */
  function orders() {
    var phone = (window.CFG && window.CFG.phone) || '';
    [].forEach.call(doc.querySelectorAll('a[data-order]'), function (a) {
      var msg = t('order_msg').replace('{item}', t(a.getAttribute('data-order')));
      a.href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
      a.target = '_blank'; a.rel = 'noopener';
    });
  }
  orders(); onLang(orders);

  /* ---- Rail : flèches, glisser à la souris, barre de progression ---- */
  var rail = doc.querySelector('.rail');
  if (rail) {
    var bar = doc.querySelector('.rail-bar i');
    function progress() {
      var max = rail.scrollWidth - rail.clientWidth;
      var p = max > 0 ? Math.abs(rail.scrollLeft) / max : 1;
      if (bar) bar.style.setProperty('--rp', Math.max(0.08, p).toFixed(3));
    }
    function step(dir) {
      var c = rail.querySelector('.rc'); if (!c) return;
      var w = c.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 0);
      rail.scrollBy({ left: dir * w * (isRtl() ? -1 : 1), behavior: reduce ? 'auto' : 'smooth' });
    }
    var pv = doc.querySelector('.rail-prev'), nx = doc.querySelector('.rail-next');
    if (pv) pv.addEventListener('click', function () { step(-1); });
    if (nx) nx.addEventListener('click', function () { step(1); });
    rail.addEventListener('scroll', progress, { passive: true });
    window.addEventListener('resize', progress);
    progress();
    /* glisser à la souris (le doigt et le pavé tactile défilent déjà nativement) */
    var down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return; var dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; rail.classList.add('drag'); }
      rail.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; rail.classList.remove('drag'); });
    rail.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    onLang(function () { rail.scrollLeft = 0; setTimeout(progress, 30); });
  }

  /* ---- Révélations au défilement : photos, pastilles des réseaux ---- */
  var rv = [].slice.call(doc.querySelectorAll('.rv, .social .soc'));
  [].forEach.call(doc.querySelectorAll('.social .soc li'), function (li, i) { li.style.setProperty('--i', i); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    rv.forEach(function (el) { io.observe(el); });
    /* filet de sécurité : ce qui est à l'écran apparaît même si l'observateur tarde (onglet en arrière-plan, vieux navigateur) */
    var pending = [].slice.call(doc.querySelectorAll('.rv, .social .soc, [data-reveal], [data-split]')), sw = null;
    function sweep() {
      sw = null;
      pending = pending.filter(function (el) {
        if (el.classList.contains('in')) return false;
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.95 && r.bottom > 0) { el.classList.add('in'); return false; }
        return true;
      });
    }
    window.addEventListener('scroll', function () { if (!sw) sw = setTimeout(sweep, 120); }, { passive: true });
    setTimeout(sweep, 1800);
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* ---- Parallaxe : photo de l'histoire, zoom de l'appel final ---- */
  var sp = doc.querySelector('.split-ph'), spi = sp && sp.querySelector('img');
  var fin = doc.querySelector('.fin3'), fini = fin && fin.querySelector('.fin3-ph img');
  var tick = false;
  function para() {
    tick = false; var vh = innerHeight;
    if (spi) { var r = sp.getBoundingClientRect(); var p = (r.top + r.height / 2 - vh / 2) / vh; spi.style.setProperty('--py', (p * -60).toFixed(1) + 'px'); }
    if (fini) { var f = fin.getBoundingClientRect(); var q = Math.max(0, Math.min(1, (vh - f.top) / (vh + f.height))); fini.style.setProperty('--fz', (1.18 - q * 0.18).toFixed(3)); }
  }
  if (!reduce && (spi || fini)) {
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(para); } }, { passive: true });
    window.addEventListener('resize', para); para();
  }

  /* ---- Google Maps dans la langue du site ---- */
  function mapLang() {
    var l = de.lang || 'fr';
    [].forEach.call(doc.querySelectorAll('iframe[src*="maps.google.com/maps"]'), function (f) {
      var u = f.getAttribute('src').replace(/&hl=[a-z]+/, '') + '&hl=' + l;
      if (f.getAttribute('src') !== u) f.setAttribute('src', u);
    });
  }
  mapLang(); onLang(mapLang);
})();
