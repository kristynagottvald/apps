(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Grid: two columns of 16:9 tiles, rendered from apps.json (newest first) ---------- */

  async function load() {
    const grid = $('#pj-grid');
    let apps = [];
    try {
      const res = await fetch('apps.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      apps = await res.json();
    } catch (err) {
      console.error(err);
    }
    if (!apps.length) {
      grid.innerHTML = '<p class="load-error">Could not load apps.json.</p>';
      return;
    }
    const cols = [[], []];
    apps.forEach((a, i) => {
      cols[i % 2].push(`<a class="pj-tile" href="${esc(a.url)}" style="--o:${i}" data-i="${i}" aria-label="${esc(a.title)}">
        <div class="pj-media"><img class="is-active" src="${esc(a.thumbnail)}" data-still="${esc(a.thumbnail)}" data-preview="${esc(a.preview || '')}" alt="${esc(a.alt || '')}" loading="lazy"></div>
        <div class="pj-cap"><span>${esc(a.title)}</span><span class="grey">${esc(a.category || '')}</span></div>
      </a>`);
    });
    grid.innerHTML = cols.map((col) => `<div class="pj-col">${col.join('')}</div>`).join('');
    bindClipHover(grid);
  }

  /* ---------- Looping clips: a checkerboard of tiles plays, then the other half takes over ---------- */

  const CLIP_MS = 6000;   // one full loop of every clip per turn
  let clipTimer = null;
  function bindClipHover(grid) {
    clearInterval(clipTimer);
    if (reduceMotion.matches) return;
    const imgs = [...grid.querySelectorAll('.pj-tile')].sort((a, b) => a.dataset.i - b.dataset.i).map((tile) => tile.querySelector('img[data-preview]'));
    let phase = 0, active = 0, hoverI = -1;
    const checker = (i) => ((i % 2) + Math.floor(i / 2)) % 2;   // tile i sits in column i % 2, row floor(i / 2)
    const want = (i) => checker(i) === active || i === hoverI;   // the hovered tile keeps looping
    const set = (i, play) => {
      const im = imgs[i];
      if (!im || !im.dataset.preview) return;
      // a fresh <img> on the cached clip always starts from its first frame. It fades in over the old one, so the
      // clip never cuts to the still (the still is the clip's first frame, which is also where the clip loops)
      const media = im.parentNode;
      const fresh = im.cloneNode();
      fresh.classList.remove('is-active');
      fresh.src = play ? im.dataset.preview : im.dataset.still;
      fresh.dataset.on = play ? '1' : '0';
      media.appendChild(fresh);
      imgs[i] = fresh;
      const show = () => {
        requestAnimationFrame(() => requestAnimationFrame(() => fresh.classList.add('is-active')));
        setTimeout(() => media.querySelectorAll('img').forEach((o) => { if (o !== imgs[i]) o.remove(); }), 900);
      };
      if (fresh.complete && fresh.naturalWidth) show(); else fresh.addEventListener('load', show, { once: true });
    };
    const sync = () => imgs.forEach((im, i) => { if (im && im.dataset.on !== (want(i) ? '1' : '0')) set(i, want(i)); });
    const tick = () => {
      if (document.hidden) return;
      active = phase; sync(); phase = 1 - phase;
      // fetch the other half's clips now so they are cached when they take over
      imgs.forEach((im, i) => { if (im && im.dataset.preview && checker(i) === phase) new Image().src = im.dataset.preview; });
    };
    grid.addEventListener('mouseover', (e) => { const t = e.target.closest('.pj-tile'); if (!t) return; const i = +t.dataset.i; if (i !== hoverI) { hoverI = i; sync(); } });
    grid.addEventListener('mouseout', (e) => { const t = e.target.closest('.pj-tile'); if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return; hoverI = -1; sync(); });
    tick();
    clipTimer = setInterval(tick, CLIP_MS);
  }

  /* ---------- Navigation pill ---------- */

  const hb = $('#hb'), hbToggle = $('#hb-toggle'), hbPill = $('.hb-pill');
  if (hbPill) {
    hbPill.addEventListener('mouseleave', () => {
      hb.classList.remove('open');
      hbToggle.setAttribute('aria-expanded', 'false');
    });
  }
  if (hbToggle) {
    hbToggle.addEventListener('click', () => {
      const isOpen = hb.classList.toggle('open');
      hbToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* ---------- Heading letter bounce: every 5-8 seconds the letters hop up one after another ---------- */

  (function bounceHeading() {
    const h = $('.work h1');
    if (!h || reduceMotion.matches) return;
    h.setAttribute('aria-label', h.textContent);
    const letters = [];
    [...h.childNodes].forEach((n) => {
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((word) => {
        if (!word) return;
        if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); return; }
        // keep each word's letters together so a line never breaks mid-word
        const w = document.createElement('span');
        w.className = 'bw';
        [...word].forEach((ch) => {
          const sp = document.createElement('span');
          sp.className = 'bl'; sp.setAttribute('aria-hidden', 'true'); sp.textContent = ch;
          letters.push(sp); w.appendChild(sp);
        });
        frag.appendChild(w);
      });
      n.replaceWith(frag);
    });
    const play = () => {
      letters.forEach((sp, i) => {
        sp.style.animationDelay = `${i * 70}ms`;
        sp.classList.remove('hop'); void sp.offsetWidth; sp.classList.add('hop');
      });
      setTimeout(next, letters.length * 70 + 700);
    };
    const next = () => setTimeout(play, 5000 + Math.random() * 3000);
    next();
  })();

  load();
})();
