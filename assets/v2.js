/* Nouvelle page d'accueil : carrousel des plaisirs du jour, compteurs. Tout est coupé si l'utilisateur demande de réduire les animations. */
(function () {
  var doc = document;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Carrousel : la couleur de la section suit la photo au centre ---- */
  var sec = doc.querySelector('.dl'), cv = doc.querySelector('.cv');
  if (sec && cv) {
    var slides = [].slice.call(cv.children), dots = [].slice.call(doc.querySelectorAll('.dots button')), cur = -1, tick = false;
    function setActive(i) {
      if (i === cur) return; cur = i;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      sec.style.setProperty('--bg', slides[i].getAttribute('data-bg'));
    }
    function nearest() {
      var mid = cv.getBoundingClientRect().left + cv.clientWidth / 2, best = 0, bd = 1e9;
      slides.forEach(function (s, k) { var r = s.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = k; } });
      setActive(best);
    }
    cv.addEventListener('scroll', function () { clearTimeout(tick); tick = setTimeout(nearest, 50); }, { passive: true });
    function go(i, instant) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      var r = slides[i].getBoundingClientRect(), c = cv.getBoundingClientRect();
      var d = (r.left + r.width / 2) - (c.left + c.width / 2);
      cv.scrollBy({ left: d, behavior: (reduce || instant) ? 'auto' : 'smooth' });
    }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
    var pv = doc.querySelector('.cv-prev'), nx = doc.querySelector('.cv-next');
    if (pv) pv.addEventListener('click', function () { go(cur - 1); });
    if (nx) nx.addEventListener('click', function () { go(cur + 1); });
    window.addEventListener('resize', function () { go(cur < 0 ? 0 : cur, true); });
    /* au changement de langue (sens de lecture), on revient à la première photo */
    new MutationObserver(function () { cv.scrollLeft = 0; setTimeout(nearest, 40); }).observe(doc.documentElement, { attributes: true, attributeFilter: ['dir'] });
    setTimeout(nearest, 60); setTimeout(nearest, 600); window.addEventListener('load', nearest);
  }

  /* ---- Compteurs ---- */
  var nums = [].slice.call(doc.querySelectorAll('[data-count]'));
  function run(el) {
    var to = +el.getAttribute('data-count'), t0 = null, dur = 1400;
    if (reduce) { el.textContent = to; return; }
    function f(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(f); }
    requestAnimationFrame(f);
  }
  nums.forEach(function (n) { n.textContent = reduce ? n.getAttribute('data-count') : '0'; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }); }, { threshold: 0.4 });
    nums.forEach(function (n) { io.observe(n); });
  } else { nums.forEach(function (n) { n.textContent = n.getAttribute('data-count'); }); }

  /* Google Maps dans la langue du site */
  function mapLang() {
    var l = doc.documentElement.lang || 'fr';
    [].forEach.call(doc.querySelectorAll('iframe[src*="maps.google.com/maps"]'), function (f) {
      var u = f.getAttribute('src').replace(/&hl=[a-z]+/, '') + '&hl=' + l;
      if (f.getAttribute('src') !== u) f.setAttribute('src', u);
    });
  }
  mapLang();
  new MutationObserver(mapLang).observe(doc.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
