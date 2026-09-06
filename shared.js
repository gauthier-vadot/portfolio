/* ================================================================
   SHARED.JS — Briques communes aux deux pages
   · chargement de data.json
   · écran de démarrage (conform)
   · curseur personnalisé
   · timecode
   · icônes sociales
   · révélation au scroll
   Vanilla JS, zéro dépendance.
   ================================================================ */
'use strict';

const SEQ = (() => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Données ────────────────────────────────────────────── */
  async function loadData() {
    const res = await fetch('data.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  /* ── Utilitaires ────────────────────────────────────────── */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function setText(id, value) {
    const n = document.getElementById(id);
    if (n && value != null) n.textContent = value;
  }

  const pad = (n, l = 2) => String(Math.max(0, Math.floor(n))).padStart(l, '0');

  /** Secondes → timecode SMPTE 00:00:00:00 (24 i/s) */
  function toTimecode(totalSeconds, fps = 24) {
    const s = Math.max(0, totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    const f = Math.floor((s % 1) * fps);
    return `${pad(h)}:${pad(m)}:${pad(sec)}:${pad(f)}`;
  }

  /** "00:03:12" ou "03:12" ou 192 → secondes */
  function parseDuration(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const parts = String(value).split(':').map(Number).filter(n => !isNaN(n));
    if (!parts.length) return 0;
    return parts.reduce((acc, p) => acc * 60 + p, 0);
  }

  /** "192" secondes → "03:12" */
  function mmss(seconds) {
    const s = Math.max(0, Math.round(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return h ? `${pad(h)}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
  }

  /** Générateur pseudo-aléatoire déterministe à partir d'une chaîne */
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += 0x6D2B79F5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const escapeHtml = (s = '') => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ── YouTube ────────────────────────────────────────────── */

  /**
   * Accepte à peu près tout ce qu'on peut copier depuis YouTube :
   *   https://www.youtube.com/watch?v=ID     https://youtu.be/ID
   *   https://www.youtube.com/embed/ID       https://www.youtube.com/shorts/ID
   *   https://www.youtube.com/live/ID        ID brut (11 caractères)
   * Renvoie l'identifiant, ou null si ce n'est pas du YouTube.
   */
  function parseYouTube(value) {
    if (!value) return null;
    const s = String(value).trim();

    // Identifiant brut
    if (/^[\w-]{11}$/.test(s)) return s;

    let url;
    try {
      url = new URL(s, location.href);
    } catch { return null; }

    const host = url.hostname.replace(/^www\.|^m\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return /^[\w-]{11}$/.test(id || '') ? id : null;
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
        return /^[\w-]{11}$/.test(parts[1] || '') ? parts[1] : null;
      }
    }
    return null;
  }

  /** true si la valeur ressemble à un fichier vidéo local ou distant */
  const isVideoFile = (v) => !!v && /\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i.test(String(v));

  /* ── Google Drive ───────────────────────────────────────── */

  /**
   * Extrait l'identifiant d'un lien Drive :
   *   https://drive.google.com/file/d/ID/view?usp=sharing
   *   https://drive.google.com/open?id=ID
   *   https://drive.google.com/uc?id=ID
   */
  function parseDrive(value) {
    if (!value) return null;
    const s = String(value).trim();
    let url;
    try { url = new URL(s, location.href); } catch { return null; }
    if (!/(^|\.)google\.com$/.test(url.hostname)) return null;
    if (!/drive|docs/.test(url.hostname) && !url.pathname.startsWith('/file/')) return null;

    const m = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (m) return m[1];
    const id = url.searchParams.get('id');
    return id || null;
  }

  /**
   * Flux direct du fichier : conserve la résolution d'origine, contrairement
   * au lecteur Drive qui retranscode (et tombe à 360p sur les formats larges).
   */
  const driveDirect = (id) =>
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download`;

  /** Lecteur Drive classique : robuste, mais qualité bridée */
  const driveEmbed = (id) =>
    `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;

  /**
   * Identifie la nature d'une source vidéo.
   * Renvoie { kind: 'youtube' | 'drive' | 'file' | 'none', id, url }
   */
  function resolveSource(...candidates) {
    for (const c of candidates) {
      if (!c) continue;
      const yt = parseYouTube(c);
      if (yt) return { kind: 'youtube', id: yt, url: c };
      const dr = parseDrive(c);
      if (dr) return { kind: 'drive', id: dr, url: c };
      if (isVideoFile(c)) return { kind: 'file', id: null, url: c };
    }
    return { kind: 'none', id: null, url: null };
  }

  /* ── Email : lisible par l'humain, opaque pour les robots ── */

  /** Encode une adresse pour ne jamais l'écrire en clair dans le HTML */
  const encodeEmail = (addr) =>
    btoa(unescape(encodeURIComponent(String(addr || '')))).split('').reverse().join('');

  const decodeEmail = (blob) => {
    try { return decodeURIComponent(escape(atob(String(blob || '').split('').reverse().join('')))); }
    catch { return ''; }
  };

  /**
   * Domaine d'intégration. `youtube.com` par défaut : le domaine sans cookie
   * refuse certaines vidéos non répertoriées. Modifiable via meta.youtubeHost.
   */
  let ytHost = 'https://www.youtube.com';
  function setYouTubeHost(host) {
    if (!host) return;
    ytHost = /^https?:\/\//.test(host) ? host.replace(/\/$/, '') : `https://${host}`;
  }
  const getYouTubeHost = () => ytHost;

  /** Construit l'URL d'intégration YouTube */
  function ytEmbed(id, opts = {}) {
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      iv_load_policy: '3',
      color: 'white',
      ...opts
    });
    return `${ytHost}/embed/${encodeURIComponent(id)}?${params}`;
  }

  /** Traduit un code d'erreur du lecteur YouTube en phrase compréhensible */
  function ytErrorMessage(code) {
    switch (Number(code)) {
      case 2:   return "Identifiant de vidéo invalide.";
      case 5:   return "Le lecteur HTML5 n'a pas pu démarrer cette vidéo.";
      case 100: return "Vidéo introuvable : supprimée, ou passée en privé.";
      case 101:
      case 150: return "Le propriétaire de la vidéo a désactivé la lecture sur les autres sites. "
                     + "Dans YouTube Studio : la vidéo → Modifier → Autres options → cochez « Autoriser l'intégration ».";
      default:  return "Le lecteur YouTube a renvoyé une erreur (code " + code + ").";
    }
  }

  /** Vignette officielle d'une vidéo YouTube */
  function ytThumb(id, quality = 'hqdefault') {
    return id ? `https://i.ytimg.com/vi/${id}/${quality}.jpg` : '';
  }

  /**
   * Charge l'API IFrame de YouTube une seule fois.
   * Permet de piloter lecture / pause / son / position depuis notre transport.
   */
  let ytApiPromise = null;
  function loadYouTubeApi() {
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) return resolve(window.YT);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prev === 'function') prev();
        resolve(window.YT);
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      s.onerror = () => reject(new Error('API YouTube indisponible'));
      document.head.appendChild(s);
      setTimeout(() => reject(new Error('API YouTube : délai dépassé')), 8000);
    });
    return ytApiPromise;
  }

  /* ── Écran de démarrage ─────────────────────────────────── */
  function boot(files = []) {
    const box  = document.getElementById('boot');
    if (!box) return Promise.resolve();
    const fill = document.getElementById('boot-fill');
    const pct  = document.getElementById('boot-pct');
    const name = document.getElementById('boot-file');

    if (reduceMotion) {
      box.dataset.done = 'true';
      return Promise.resolve();
    }

    const list = files.length ? files : ['data.json', 'assets/', 'timeline'];

    return new Promise(resolve => {
      let p = 0;
      const step = () => {
        p = Math.min(100, p + 6 + Math.random() * 16);
        if (fill) fill.style.width = p + '%';
        if (pct)  pct.textContent = pad(Math.round(p)) + '%';
        if (name) name.textContent = list[Math.min(list.length - 1, Math.floor(p / 100 * list.length))];
        if (p < 100) {
          setTimeout(step, 55 + Math.random() * 55);
        } else {
          setTimeout(() => {
            box.dataset.done = 'true';
            document.body.style.overflow = '';
            resolve();
          }, 200);
        }
      };
      document.body.style.overflow = 'hidden';
      setTimeout(step, 120);
    });
  }

  /* ── Curseur personnalisé ───────────────────────────────── */
  function initCursor() {
    const cur = document.getElementById('cursor');
    if (!cur || reduceMotion) return;
    if (window.matchMedia('(pointer: coarse)').matches) { cur.style.display = 'none'; return; }

    const label = document.getElementById('cursor-label');
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;

    window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });

    (function loop() {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      cur.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(loop);
    })();

    // Délégation : n'importe quel élément portant data-cursor / data-cursor-label
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) {
        document.body.dataset.cursor = t.dataset.cursor;
        if (label) label.textContent = t.dataset.cursorLabel || '';
      }
    });
    document.addEventListener('pointerout', e => {
      const t = e.target.closest('[data-cursor]');
      if (t && !t.contains(e.relatedTarget)) {
        delete document.body.dataset.cursor;
        if (label) label.textContent = '';
      }
    });
  }

  /* ── Révélation au scroll ───────────────────────────────── */
  function initReveal() {
    const items = $$('.rv');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(i => i.dataset.in = 'true');
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.dataset.in = 'true'; io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(i => io.observe(i));
  }

  /* ── Icônes réseaux sociaux ─────────────────────────────── */
  const SOCIAL_ICONS = {
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
    vimeo:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.98 6.42c-.11 2.34-1.74 5.54-4.9 9.61-3.26 4.25-6.02 6.37-8.29 6.37-1.4 0-2.58-1.3-3.55-3.88L5.32 11.4C4.6 8.82 3.83 7.52 3.01 7.52c-.18 0-.81.38-1.88 1.13L0 7.2c1.19-1.04 2.35-2.08 3.5-3.13C5.08 2.7 6.27 1.98 7.06 1.91c1.87-.18 3.02 1.1 3.45 3.84.47 2.95.79 4.79.97 5.5.54 2.45 1.12 3.67 1.76 3.67.5 0 1.25-.79 2.25-2.36 1-1.58 1.53-2.78 1.6-3.6.13-1.26-.37-1.9-1.53-1.9-.54 0-1.1.13-1.68.38 1.12-3.65 3.25-5.43 6.4-5.33 2.34.07 3.44 1.59 3.31 4.55z"/></svg>',
    youtube:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>',
    instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.7 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92C8.42 2.17 8.8 2.16 12 2.16zm0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.28 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.28 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.89 1.44 1.44 0 0 0 0-2.89z"/></svg>',
    behance:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.94 4.5c.7 0 1.34.06 1.92.19.58.13 1.07.33 1.48.61.42.28.74.65.96 1.12.23.47.34 1.05.34 1.73 0 .74-.17 1.36-.5 1.86-.34.5-.84.9-1.5 1.22.9.26 1.57.72 2.02 1.37.44.66.66 1.45.66 2.36 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-1.16 1.35-.49.35-1.07.6-1.72.75-.66.15-1.35.22-2.08.22H0V4.5h6.94zm-.41 5.32c.59 0 1.07-.14 1.44-.42.37-.28.55-.72.55-1.3 0-.33-.07-.6-.19-.82a1.3 1.3 0 0 0-.49-.51 2 2 0 0 0-.7-.24c-.27-.04-.55-.06-.84-.06H3.5v3.35h3.03zm.16 5.54c.32 0 .62-.03.9-.09.28-.06.52-.16.72-.3.2-.15.36-.34.48-.58.12-.24.17-.55.17-.93 0-.73-.2-1.25-.61-1.57-.4-.32-.94-.47-1.61-.47H3.5v3.94h3.19zM15.4 3.9h5.82v1.42H15.4V3.9zm7.7 9.42c.1-1.68-.3-3.06-1.2-4.14-.9-1.08-2.2-1.62-3.9-1.62-1.55 0-2.83.5-3.83 1.5-1 1-1.5 2.33-1.5 3.98 0 1.7.48 3.03 1.45 4 .97.96 2.28 1.44 3.93 1.44 1.24 0 2.3-.28 3.18-.85.88-.57 1.5-1.44 1.86-2.6h-2.6c-.1.36-.35.68-.77.96-.42.28-.9.42-1.46.42-.78 0-1.38-.2-1.8-.62-.42-.4-.66-1.1-.7-2.06h7.34v-.4zm-7.3-1.5c.06-.76.3-1.33.7-1.7.4-.38.94-.57 1.6-.57.63 0 1.15.2 1.55.58.4.4.63.96.68 1.7h-4.54z"/></svg>',
    twitter:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 1.15h3.68l-8.05 9.2L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.84L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.3 19.5h2.04L6.5 3.24H4.3L17.6 20.65z"/></svg>',
    tiktok:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.3v13.2a2.6 2.6 0 1 1-1.86-2.5V10.3a5.9 5.9 0 1 0 5.16 5.85V9.4a7.55 7.55 0 0 0 4.4 1.4V7.5a4.3 4.3 0 0 1-3.34-1.68z"/></svg>',
    artstation:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M0 17.72l2.23 3.86A2.2 2.2 0 0 0 4.2 22.7h13.4l-2.88-4.98H0zM24 17.72c0-.4-.12-.79-.33-1.13L15.5 2.55A2.2 2.2 0 0 0 13.6 1.3H9.75l11.4 19.74 2.5-4.3c.29-.5.35-.7.35-1.02zM11.06 6.02l5.03 8.72H6.03l5.03-8.72z"/></svg>',
    website:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm7.9 7.2h-3.1a18.6 18.6 0 0 0-1.6-4.1 9.6 9.6 0 0 1 4.7 4.1zM12 2.4c.9 1.3 1.6 2.8 2 4.8H10c.4-2 1.1-3.5 2-4.8zM2.7 14.4A9.4 9.4 0 0 1 2.4 12c0-.8.1-1.6.3-2.4h3.5a20 20 0 0 0 0 4.8H2.7zm1 2.4h3.1c.4 1.5.9 2.9 1.6 4.1a9.6 9.6 0 0 1-4.7-4.1zm3.1-9.6H3.7a9.6 9.6 0 0 1 4.7-4.1c-.7 1.2-1.2 2.6-1.6 4.1zM12 21.6c-.9-1.3-1.6-2.8-2-4.8h4c-.4 2-1.1 3.5-2 4.8zm2.5-7.2h-5a17 17 0 0 1 0-4.8h5a17 17 0 0 1 0 4.8zm.4 6.7c.7-1.2 1.2-2.6 1.6-4.1h3.1a9.6 9.6 0 0 1-4.7 4.1zm2-6.7a20 20 0 0 0 0-4.8h3.5c.2.8.3 1.6.3 2.4s-.1 1.6-.3 2.4h-3.5z"/></svg>'
  };

  const socialIcon = (key) => SOCIAL_ICONS[String(key || '').toLowerCase()] || SOCIAL_ICONS.website;

  /* ── Forme d'onde (canvas) ──────────────────────────────── */
  function drawWaveform(canvas, seedStr, color = 'rgba(255,255,255,0.4)') {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || 74;
    if (!w) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const rand = seeded(seedStr);
    const barW = 2, gap = 1;
    const mid = h / 2;
    ctx.fillStyle = color;

    let phase = 0;
    for (let x = 0; x < w; x += barW + gap) {
      phase += 0.09;
      // enveloppe : alternance de passages calmes et de pics
      const envelope = 0.35 + 0.65 * Math.abs(Math.sin(phase * 0.31)) * (0.55 + rand() * 0.45);
      const amp = Math.max(1.5, envelope * (mid - 4));
      ctx.fillRect(x, mid - amp, barW, amp * 2);
    }
  }

  /* ── API publique ───────────────────────────────────────── */
  return {
    reduceMotion, loadData, $, $$, el, setText, pad,
    toTimecode, parseDuration, mmss, seeded, escapeHtml,
    boot, initCursor, initReveal, socialIcon, drawWaveform,
    parseYouTube, isVideoFile, ytEmbed, ytThumb, loadYouTubeApi,
    setYouTubeHost, getYouTubeHost, ytErrorMessage,
    parseDrive, driveDirect, driveEmbed, resolveSource,
    encodeEmail, decodeEmail
  };
})();
