(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  root.classList.add('js');
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]motion=on/.test(w.location.search);
  var isEn = root.lang === 'en';
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---------- hero video ---------- */
  var v = $('#heroVideo');
  var pp = $('#heroPP');
  var tc = $('#heroTC');
  if (v) {
    // pick the best file for this screen and connection
    var small = w.matchMedia('(max-width: 900px)').matches;
    var conn = navigator.connection || {};
    var slow = conn.saveData || (conn.effectiveType && conn.effectiveType !== '4g');
    var px = w.innerWidth * (w.devicePixelRatio || 1);
    var key = small ? 'data-src-sm' : slow ? 'data-src' : px >= 2400 ? 'data-src-xl' : 'data-src-hq';
    v.src = v.getAttribute(key) || v.getAttribute('data-src');
    v.muted = true;
    v.setAttribute('playsinline', '');
    var fmt = function (t) { t = Math.max(0, Math.floor(t || 0)); return ('0' + Math.floor(t / 60)).slice(-2) + ':' + ('0' + (t % 60)).slice(-2); };
    var tick = function () {
      if (tc && v.duration) tc.textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration);
      if (!v.paused) requestAnimationFrame(tick);
    };
    var setPP = function () { if (pp) { pp.classList.toggle('paused', v.paused); pp.setAttribute('aria-label', v.paused ? (isEn ? 'Play video' : '動画を再生') : (isEn ? 'Pause video' : '動画を一時停止')); } };
    v.addEventListener('play', function () { setPP(); requestAnimationFrame(tick); });
    v.addEventListener('pause', setPP);
    v.addEventListener('loadedmetadata', function () { if (tc) tc.textContent = fmt(0) + ' / ' + fmt(v.duration); });
    // muted, no audio track; always has a visible pause control, so it plays even with reduced motion
    var userPaused = false;
    var p = v.play(); if (p && p.catch) p.catch(function () { setPP(); });
    if (pp) pp.addEventListener('click', function () { if (v.paused) { userPaused = false; v.play(); } else { userPaused = true; v.pause(); } });
    // pause when hero is out of view
    if ('IntersectionObserver' in w) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (userPaused) return; if (e.isIntersecting) { v.play().catch(function () {}); } else { v.pause(); } });
      }, { threshold: 0.05 }).observe(v);
    }
  }

  /* ---------- scroll: header + hero parallax ---------- */
  var hdr = $('#hdr'), hero = $('#hero'), hi = $('#heroInner'), toTop = $('#toTop');
  var lastY = 0, ticking = false;
  function onScroll() {
    var y = w.pageYOffset, vh = w.innerHeight;
    hdr.classList.toggle('is-solid', y > 40);
    if (!root.classList.contains('nav-open')) hdr.classList.toggle('is-hidden', y > vh * 0.9 && y > lastY + 4);
    if (y < lastY - 4) hdr.classList.remove('is-hidden');
    lastY = y;
    if (hero) {
      // phase 1: video only. phase 2: headline and copy fade in as you scroll
      var k = reduce ? 1 : Math.min(1, Math.max(0, (y - vh * 0.10) / (vh * 0.45)));
      k = k * k * (3 - 2 * k);
      hero.style.setProperty('--r', k.toFixed(3));
      hero.dataset.vis = k > 0.35 ? '1' : '0';
      if (!reduce && y < vh * 1.3) hero.style.setProperty('--s', (1 + Math.min(1, y / vh) * 0.06).toFixed(4));
    }
    if (toTop) toTop.classList.toggle('show', y > vh * 1.2);
    ticking = false;
  }
  w.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  if (hi) hi.addEventListener('focusin', function () { if (w.pageYOffset < w.innerHeight * 0.6) w.scrollTo(0, Math.ceil(w.innerHeight * 0.6)); });

  /* ---------- mobile menu ---------- */
  var burger = $('#burger');
  function closeNav() { root.classList.remove('nav-open'); if (burger) { burger.setAttribute('aria-expanded', 'false'); } }
  if (burger) {
    burger.addEventListener('click', function () {
      var open = root.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hdr.classList.remove('is-hidden');
    });
    $$('#nav a').forEach(function (a) { a.addEventListener('click', closeNav); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
    w.matchMedia('(min-width: 960px)').addEventListener('change', closeNav);
  }

  /* ---------- reveal + count up ---------- */
  var rv = $$('.rv');
  if ('IntersectionObserver' in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); countIn(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }
  function countIn(root) {
    $$('[data-count]', root).concat(root.hasAttribute && root.hasAttribute('data-count') ? [root] : []).forEach(function (el) {
      if (el.dataset.done) return; el.dataset.done = 1;
      var end = parseFloat(el.dataset.count), t0 = null, dur = 1400;
      function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); var v = Math.round(end * e); el.textContent = el.dataset.comma ? v.toLocaleString('en-US') : v; if (p < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
  }

  /* ---------- active nav ---------- */
  var links = $$('#nav a.lnk');
  if ('IntersectionObserver' in w && links.length) {
    var map = {}; links.forEach(function (a) { map[a.getAttribute('href').replace('#', '')] = a; });
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && map[e.target.id]) { links.forEach(function (a) { a.classList.remove('on'); }); map[e.target.id].classList.add('on'); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = d.getElementById(id); if (s) so.observe(s); });
  }

  /* ---------- lightbox ---------- */
  var lb = $('#lb');
  if (lb && lb.showModal) {
    var lbImg = $('img', lb);
    $$('.wk').forEach(function (b) {
      b.addEventListener('click', function () { lbImg.src = b.dataset.full; lbImg.alt = $('img', b).alt; lb.showModal(); });
    });
    lb.addEventListener('click', function () { lb.close(); });
  }

  /* ---------- to top ---------- */
  if (toTop) toTop.addEventListener('click', function () { w.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- contact form ---------- */
  var form = $('#contactForm');
  if (form) {
    var st = $('#formStatus');
    var btn = $('button[type=submit]', form);
    var msg = {
      ok: isEn ? 'Thank you. We have received your message and will get back to you shortly.' : 'お問い合わせを承りました。担当者より折り返しご連絡いたします。',
      mail: isEn ? 'Opening your email app with the message filled in. Please press send there.' : 'メールアプリを開きます。内容をご確認のうえ、そのまま送信してください。',
      req: isEn ? 'Please fill in the required fields.' : '必須項目をご入力ください。',
      sending: isEn ? 'Sending…' : '送信中…'
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = $$('[required]', form).filter(function (f) { var ok = f.type === 'email' ? /.+@.+\..+/.test(f.value) : f.value.trim() !== ''; f.setAttribute('aria-invalid', ok ? 'false' : 'true'); return !ok; });
      if (bad.length) { st.className = 'status err'; st.textContent = msg.req; bad[0].focus(); return; }
      var label = btn.textContent; btn.disabled = true; btn.textContent = msg.sending; st.className = 'status'; st.textContent = '';
      var data = new FormData(form);
      var subjText = (isEn ? '[Website] Inquiry from ' : '【HPより】お問い合わせ：') + (data.get('company') || data.get('name'));
      var payload = {
        name: data.get('name'), company: data.get('company') || '-', email: data.get('email'), type: data.get('type'), message: data.get('message'),
        _subject: subjText, _template: 'table', _captcha: 'false', _honey: data.get('bot-field') || ''
      };
      var endpoint = form.getAttribute('data-endpoint');
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !(j.success === true || j.success === 'true')) throw new Error('x'); }); })
        .then(function () { st.className = 'status ok'; st.textContent = msg.ok; form.reset(); })
        .catch(function () {
          var sub = encodeURIComponent(subjText);
          var txt = encodeURIComponent((isEn ? 'Name: ' : 'お名前：') + data.get('name') + '\n' + (isEn ? 'Company: ' : '会社名：') + (data.get('company') || '-') + '\n' + (isEn ? 'Email: ' : 'メール：') + data.get('email') + '\n' + (isEn ? 'Topic: ' : 'ご相談内容：') + data.get('type') + '\n\n' + data.get('message'));
          st.className = 'status ok'; st.textContent = msg.mail;
          w.location.href = 'mailto:contact@butterfly-drone.com?subject=' + sub + '&body=' + txt;
        })
        .finally(function () { btn.disabled = false; btn.textContent = label; });
    });
    $$('input,textarea', form).forEach(function (f) { f.addEventListener('input', function () { f.setAttribute('aria-invalid', 'false'); }); });
  }
})();
