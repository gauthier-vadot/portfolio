/* ================================================================
   APP.JS — Moteur de la page d'accueil
   Tout le contenu provient de data.json. Aucun texte en dur.
   ================================================================ */
'use strict';

(async function () {

  const { $, el, setText, toTimecode, parseDuration, mmss, escapeHtml,
          socialIcon, drawWaveform, reduceMotion,
          parseYouTube, isVideoFile, ytEmbed, ytThumb, loadYouTubeApi,
          setYouTubeHost, ytErrorMessage } = SEQ;

  /* ── Chargement ──────────────────────────────────────────── */
  let data;
  try {
    data = await SEQ.loadData();
  } catch (err) {
    console.error('data.json introuvable :', err);
    document.getElementById('boot')?.setAttribute('data-done', 'true');
    document.body.style.overflow = '';
    document.getElementById('load-error')?.removeAttribute('hidden');
    return;
  }

  /* Accent personnalisable depuis le JSON */
  if (data.meta?.accent) {
    document.documentElement.style.setProperty('--accent', data.meta.accent);
  }
  setYouTubeHost(data.meta?.youtubeHost);

  const bootFiles = [
    'data.json',
    data.hero?.showreelUrl?.split('/').pop() || 'showreel.mov',
    ...(data.portfolio?.projects || []).slice(0, 3).map(p => (p.thumbnail || '').split('/').pop()),
    'timeline.seq'
  ].filter(Boolean);

  const bootDone = SEQ.boot(bootFiles);

  /* ================================================================
     MÉTA + CHROME
     ================================================================ */
  function buildMeta(meta = {}) {
    document.title = meta.siteTitle || 'Portfolio';
    document.documentElement.lang = meta.lang || 'fr';
    const d = document.getElementById('meta-desc');
    if (d && meta.description) d.setAttribute('content', meta.description);
    setText('site-title', meta.siteTitle);
    setText('tb-initials', meta.initials || '');
    setText('tb-seq', meta.sequenceName || '');
  }

  function buildNav(nav = []) {
    const bar = document.getElementById('tb-nav');
    const mob = document.getElementById('mobile-menu');
    if (bar) bar.innerHTML = '';
    if (mob) mob.innerHTML = '';

    nav.forEach(item => {
      const a = el('a');
      a.href = '#' + item.target;
      a.dataset.target = item.target;
      a.innerHTML = `<span class="code">${escapeHtml(item.code || '')}</span><span>${escapeHtml(item.label)}</span>`;
      a.dataset.cursor = 'link';
      bar?.appendChild(a);

      const m = el('a');
      m.href = '#' + item.target;
      m.innerHTML = `<span class="code">${escapeHtml(item.code || '')}</span><span>${escapeHtml(item.label)}</span>`;
      m.addEventListener('click', closeMenu);
      mob?.appendChild(m);
    });
  }

  function closeMenu() {
    document.getElementById('mobile-menu')?.setAttribute('data-open', 'false');
    document.getElementById('tb-burger')?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function initBurger() {
    const b = document.getElementById('tb-burger');
    const m = document.getElementById('mobile-menu');
    if (!b || !m) return;
    b.addEventListener('click', () => {
      const open = m.getAttribute('data-open') === 'true';
      m.setAttribute('data-open', String(!open));
      b.setAttribute('aria-expanded', String(!open));
      document.body.style.overflow = open ? '' : 'hidden';
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  /* ================================================================
     01 — MONITEUR
     ================================================================ */
  /* Lignes de la fiche technique alimentées par le lecteur */
  const specTokens = [];

  function buildMonitor(hero = {}) {
    setText('hero-tagline', hero.tagline);
    setText('hero-location', hero.location || '');

    if (hero.available) {
      document.getElementById('hero-avail')?.removeAttribute('hidden');
      setText('hero-avail-label', hero.availableLabel || 'Disponible');
    }

    // Nom en deux lignes animées
    const name = document.getElementById('hero-name');
    if (name) {
      name.innerHTML =
        `<span class="ln"><span>${escapeHtml(hero.firstName || '')}</span></span>` +
        `<span class="ln"><span>${escapeHtml(hero.lastName || '')}</span></span>`;
    }

    // Boutons
    const actions = document.getElementById('hero-actions');
    if (actions && hero.ctaLabel) {
      const a = el('a', 'btn btn-accent');
      a.href = '#' + (hero.ctaTarget || 'timeline');
      a.dataset.cursor = 'link';
      a.innerHTML = `<span>${escapeHtml(hero.ctaLabel)}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 7h9.2L7.6 3.4 9 2l6 6-6 6-1.4-1.4L11.2 9H2z"/></svg>`;
      actions.appendChild(a);
    }

    // Nom du média dans la barre du moniteur
    const ytId = parseYouTube(hero.showreelUrl);
    setText('mon-src-name', ytId
      ? `YOUTUBE · ${ytId}`
      : ((hero.showreelUrl || '').split('/').pop() || 'SHOWREEL.mov').toUpperCase());

    /* Fiche technique.
       Une valeur peut contenir un jeton — {{title}}, {{duration}}, {{timecode}},
       {{quality}} — que le lecteur remplit et tient à jour en temps réel. */
    const list = document.getElementById('spec-list');
    if (list) {
      (hero.specs || []).forEach(s => {
        const row = el('div', 'spec-row');
        const token = /^\s*\{\{\s*(\w+)\s*\}\}\s*$/.exec(s.value || '');
        row.innerHTML = `<span class="k">${escapeHtml(s.key)}</span>
          <span class="v">${token ? '—' : escapeHtml(s.value)}</span>`;
        list.appendChild(row);
        if (token) specTokens.push({ node: row.querySelector('.v'), token: token[1] });
      });
    }

    // Vumètre décoratif
    const vu = document.getElementById('vu-bars');
    if (vu && !reduceMotion) {
      for (let i = 0; i < 26; i++) {
        const b = el('i');
        b.style.animationDelay = (i * 0.045).toFixed(2) + 's';
        b.style.animationDuration = (0.75 + Math.random() * 1.1).toFixed(2) + 's';
        vu.appendChild(b);
      }
    }

    initPlayer(hero);
  }

  /**
   * Lecteur du moniteur d'accueil.
   * Accepte indifféremment un lien YouTube (watch, youtu.be, shorts…) ou un
   * fichier vidéo. Dans les deux cas la barre de transport reste fonctionnelle :
   * pour YouTube on pilote la lecture via l'API IFrame officielle.
   */
  function initPlayer(hero) {
    const slot = document.getElementById('mon-video');
    if (!slot) return;

    const ICON_PLAY  = '<path d="M3 2l11 6-11 6z"/>';
    const ICON_PAUSE = '<path d="M4 2h3v12H4zM9 2h3v12H9z"/>';

    const playBtn  = document.getElementById('mon-play');
    const playIcon = document.getElementById('mon-play-icon');
    const muteBtn  = document.getElementById('mon-mute');
    const muteIcon = document.getElementById('mon-mute-icon');
    const prevBtn  = document.getElementById('mon-prev');
    const fullBtn  = document.getElementById('mon-full');
    const vol      = document.getElementById('mon-vol');
    const rail     = document.getElementById('mon-rail');
    const fill     = document.getElementById('mon-fill');
    const stage    = document.querySelector('.mon-video-wrap');

    const ICON_SOUND = '<path d="M8 2 4.5 5H2v6h2.5L8 14z"/><path d="M10.5 5.2a4 4 0 0 1 0 5.6l1.1 1.1a5.5 5.5 0 0 0 0-7.8z"/>';
    const ICON_MUTED = '<path d="M8 2 4.5 5H2v6h2.5L8 14z"/><path d="M11 6.1 12.9 8l1.9-1.9.9.9L13.8 8.9l1.9 1.9-.9.9-1.9-1.9-1.9 1.9-.9-.9 1.9-1.9-1.9-1.9z"/>';

    /* Interface commune aux deux types de source */
    let api = null;

    function refreshSound() {
      if (!api || !vol) return;
      const muted = api.isMuted?.() ?? true;
      const level = muted ? 0 : (api.getVolume?.() ?? 100);
      vol.value = level;
      vol.style.setProperty('--fill', level + '%');
      if (muteIcon) muteIcon.innerHTML = muted || level === 0 ? ICON_MUTED : ICON_SOUND;
      muteBtn?.setAttribute('aria-label', muted ? 'Activer le son' : 'Couper le son');
      if (muteBtn) muteBtn.style.color = muted || level === 0 ? '' : 'var(--accent)';
    }

    function bindTransport() {
      playBtn?.addEventListener('click', () => {
        if (!api) return;
        if (api.isPaused()) { api.play();  if (playIcon) playIcon.innerHTML = ICON_PAUSE; }
        else                { api.pause(); if (playIcon) playIcon.innerHTML = ICON_PLAY; }
      });

      muteBtn?.addEventListener('click', () => {
        if (!api) return;
        const muted = api.toggleMute();
        // En sortant du muet, on remonte à un niveau audible
        if (!muted && (api.getVolume?.() ?? 0) === 0) api.setVolume?.(70);
        refreshSound();
      });

      // Curseur de volume : régler le son démute automatiquement
      vol?.addEventListener('input', () => {
        if (!api) return;
        const v = Number(vol.value);
        api.setVolume?.(v);
        if (v > 0 && api.isMuted?.()) api.unMute?.();
        if (v === 0) api.mute?.();
        refreshSound();
      });

      prevBtn?.addEventListener('click', () => { api?.seek(0); api?.play(); });

      rail?.addEventListener('click', e => {
        if (!api) return;
        const r = rail.getBoundingClientRect();
        const d = api.duration();
        if (d) api.seek(((e.clientX - r.left) / r.width) * d);
      });

      // Plein écran sur le cadre du moniteur : garde l'habillage du site
      fullBtn?.addEventListener('click', () => {
        const target = stage || document.querySelector('.mon-frame');
        if (!target) return;
        if (document.fullscreenElement) document.exitFullscreen?.();
        else (target.requestFullscreen?.() || target.webkitRequestFullscreen?.())?.catch?.(() => {});
      });
      document.addEventListener('fullscreenchange', () => {
        fullBtn?.setAttribute('aria-label',
          document.fullscreenElement ? 'Quitter le plein écran' : 'Passer en plein écran');
      });
    }

    /** Remplit les lignes de spécifications marquées d'un jeton */
    function refreshSpecs() {
      if (!api) return;
      specTokens.forEach(({ node, token }) => {
        if (token === 'duration')      node.textContent = toTimecode(api.duration());
        else if (token === 'timecode') node.textContent = toTimecode(api.time());
        else if (token === 'title')    node.textContent = api.title?.() || '—';
        else if (token === 'quality')  node.textContent = (api.quality?.() || '—').toUpperCase();
      });
    }

    function tick() {
      if (api) {
        const t = api.time(), d = api.duration();
        setText('mon-cur', mmss(t));
        setText('mon-dur', mmss(d));
        setText('mon-osd-tc', toTimecode(t));
        if (fill && d) fill.style.width = Math.min(100, (t / d) * 100) + '%';
        refreshSpecs();
      }
      requestAnimationFrame(tick);
    }

    const ytId = parseYouTube(hero.showreelUrl);

    /* ── Source YouTube ──
       On construit l'iframe nous-mêmes et on l'affiche tout de suite : la
       vidéo joue même si l'API JavaScript de YouTube ne se charge pas
       (bloqueur de pub, réseau d'entreprise…). L'API n'est sollicitée qu'en
       bonus, pour brancher la barre de transport. */
    if (ytId) {
      const holder = el('div', 'mon-embed');
      holder.id = 'mon-embed';
      holder.style.backgroundImage = `url('${hero.showreelPoster || ytThumb(ytId)}')`;

      /* Volontairement PAS de `loop=1&playlist=ID` : cette astuce fait basculer
         le lecteur en mode playlist, ce que YouTube refuse pour les vidéos non
         répertoriées — d'où un « Vidéo non disponible » trompeur. La boucle est
         gérée plus bas par l'API, à la fin de la lecture. */
      const vars = {
        autoplay: '1', mute: '1', controls: '0',
        disablekb: '1', fs: '0', enablejsapi: '1',
        cc_load_policy: '0'   // pas de sous-titres imposés (point 1)
      };
      // L'API exige que l'origine soit déclarée pour dialoguer avec la page
      if (location.protocol === 'http:' || location.protocol === 'https:') {
        vars.origin = location.origin;
      }

      const frame = document.createElement('iframe');
      frame.id = 'mon-yt';
      frame.title = `Showreel — ${hero.firstName || ''} ${hero.lastName || ''}`.trim();
      frame.setAttribute('frameborder', '0');
      frame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; web-share');
      frame.addEventListener('load', () => { holder.dataset.ready = 'true'; });
      frame.src = ytEmbed(ytId, vars);

      holder.appendChild(frame);
      slot.replaceWith(holder);

      // Si l'iframe n'a rien chargé, on propose un lien direct
      const watchdog = setTimeout(() => {
        if (holder.dataset.ready !== 'true') {
          holder.innerHTML = `<a class="mon-embed-fallback" href="https://www.youtube.com/watch?v=${ytId}"
            target="_blank" rel="noopener">Ouvrir le showreel sur YouTube ↗</a>`;
          holder.dataset.ready = 'true';
          setText('mon-src-name', 'LECTEUR BLOQUÉ — ouvrez la vidéo sur YouTube');
        }
      }, 7000);

      /* Affiche la cause réelle par-dessus le lecteur, sans ouvrir la console */
      const showProblem = (message) => {
        clearTimeout(watchdog);
        holder.dataset.ready = 'true';
        holder.querySelector('.mon-embed-msg')?.remove();
        const box = el('div', 'mon-embed-msg');
        box.innerHTML = `<strong>Lecture impossible</strong><span>${escapeHtml(message)}</span>
          <a href="https://www.youtube.com/watch?v=${ytId}" target="_blank" rel="noopener">Voir sur YouTube ↗</a>`;
        holder.appendChild(box);
        setText('mon-src-name', 'LECTURE IMPOSSIBLE — voir le message dans le moniteur');
        console.warn('[showreel]', message);
      };

      // Barre de transport : nécessite l'API, mais son absence n'empêche pas la lecture
      loadYouTubeApi()
        .then(YT => new Promise((resolve, reject) => {
          const player = new YT.Player(frame, {
            events: {
              onReady: () => resolve(player),
              onError: e => showProblem(ytErrorMessage(e.data)),
              onStateChange: e => {
                // Boucle sans passer par le mode playlist
                if (e.data === YT.PlayerState.ENDED && hero.showreelLoop !== false) {
                  e.target.seekTo(0, true);
                  e.target.playVideo();
                }
              }
            }
          });
          setTimeout(() => reject(new Error('pas de réponse du lecteur')), 6000);
        }))
        .then(player => {
          if (playIcon) playIcon.innerHTML = ICON_PAUSE;
          try { player.unloadModule?.('captions'); player.unloadModule?.('cc'); } catch (e) {}
          api = {
            play:  () => player.playVideo(),
            pause: () => player.pauseVideo(),
            seek:  t => player.seekTo(t, true),
            time:  () => player.getCurrentTime?.() || 0,
            duration: () => player.getDuration?.() || 0,
            isPaused: () => player.getPlayerState?.() !== 1,
            isMuted: () => player.isMuted?.() ?? true,
            mute:   () => player.mute(),
            unMute: () => player.unMute(),
            getVolume: () => player.getVolume?.() ?? 0,
            setVolume: v => player.setVolume?.(v),
            title:   () => player.getVideoData?.()?.title || '',
            quality: () => player.getPlaybackQuality?.() || '',
            toggleMute: () => {
              const m = player.isMuted();
              if (m) player.unMute(); else player.mute();
              return !m;
            }
          };
          refreshSound();
        })
        .catch(err => {
          console.warn('Transport YouTube indisponible :', err.message);
          document.querySelector('.mon-transport')?.setAttribute('data-inert', 'true');
        });

      bindTransport();
      requestAnimationFrame(tick);
      return;
    }

    /* ── Source fichier vidéo ── */
    const v = slot;
    if (hero.showreelPoster) v.setAttribute('poster', hero.showreelPoster);
    if (hero.showreelUrl) v.src = hero.showreelUrl;
    v.play?.().catch(() => {});

    api = {
      play:  () => v.play(),
      pause: () => v.pause(),
      seek:  t => { v.currentTime = t; },
      time:  () => v.currentTime || 0,
      duration: () => v.duration || 0,
      isPaused: () => v.paused,
      isMuted: () => v.muted,
      mute:   () => { v.muted = true; },
      unMute: () => { v.muted = false; },
      getVolume: () => Math.round(v.volume * 100),
      setVolume: n => { v.volume = Math.max(0, Math.min(1, n / 100)); },
      title:   () => (hero.showreelUrl || '').split('/').pop(),
      quality: () => v.videoHeight ? v.videoHeight + 'p' : '',
      toggleMute: () => { v.muted = !v.muted; return v.muted; }
    };
    refreshSound();

    v.addEventListener('error', () => {
      setText('mon-src-name', 'MÉDIA HORS LIGNE — vérifiez hero.showreelUrl');
    });

    bindTransport();
    requestAnimationFrame(tick);
  }

  /* ================================================================
     02 — RACK D'EFFETS
     ================================================================ */
  function buildRack(about = {}) {
    setText('rack-title', about.sectionTitle || 'Profil');
    setText('rack-sub', about.sectionSubtitle || '');
    setText('rack-note-title', about.bioHeading || 'Note de séquence');
    setText('rack-bio', about.bio || '');
    setText('rack-fx-title', about.skillsHeading || "Rack d'effets");

    /* Photo si elle existe, sinon monogramme animé (point 6) */
    const photo = document.getElementById('rack-photo');
    const visual = document.getElementById('rack-visual');
    if (about.photo) {
      photo?.removeAttribute('hidden');
      if (photo) {
        photo.src = about.photo;
        photo.alt = about.photoAlt || '';
        photo.addEventListener('error', () => { photo.setAttribute('hidden', ''); buildMonogram(visual, about); });
      }
    } else {
      buildMonogram(visual, about);
    }

    const stats = document.getElementById('rack-stats');
    if (stats) {
      (about.stats || []).forEach(s => {
        const n = el('div', 'rack-stat');
        n.innerHTML = `<div class="v">${escapeHtml(s.value)}</div><div class="l">${escapeHtml(s.label)}</div>`;
        stats.appendChild(n);
      });
      if (!(about.stats || []).length) stats.remove();
    }

    const skills = about.skills || [];
    setText('rack-fx-count', skills.length ? `${SEQ.pad(skills.length)} ACTIFS` : '');

    const list = document.getElementById('fx-list');
    if (list) {
      skills.forEach(s => {
        const item = el('div', 'fx-item');
        item.setAttribute('role', 'listitem');
        item.innerHTML = `
          <img src="${escapeHtml(s.icon || '')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
          <div class="fx-txt">
            <div class="fx-name">${escapeHtml(s.name)}</div>
            ${s.role ? `<div class="fx-role">${escapeHtml(s.role)}</div>` : ''}
          </div>
          <span class="fx-led" aria-hidden="true"></span>`;
        list.appendChild(item);
      });
    }

    const cta = document.getElementById('rack-cta');
    if (cta && about.cvUrl) {
      const a = el('a', 'btn');
      a.href = about.cvUrl;
      a.setAttribute('download', '');
      a.dataset.cursor = 'link';
      a.dataset.cursorLabel = 'PDF';
      a.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7 1h2v7.2l2.6-2.6L13 7l-5 5-5-5 1.4-1.4L7 8.2zM2 13h12v2H2z"/></svg>
        <span>${escapeHtml(about.cvLabel || 'Télécharger le CV')}</span>`;
      cta.appendChild(a);
    }
  }

  /**
   * Monogramme animé, à la place de la photo de profil.
   * Les initiales se tracent au trait puis se remplissent, sur une mire
   * de calibrage discrète — dans l'esprit d'une amorce de bobine.
   */
  function buildMonogram(container, about = {}) {
    if (!container || container.querySelector('.mono-logo')) return;
    const initials = (data.meta?.initials || 'GV').slice(0, 2).toUpperCase();

    const box = el('div', 'mono-logo');
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', about.photoAlt || `Monogramme ${initials}`);
    box.innerHTML = `
      <svg viewBox="0 0 240 240" aria-hidden="true">
        <defs>
          <clipPath id="mono-clip"><circle cx="120" cy="120" r="96"/></clipPath>
        </defs>
        <g class="mono-grid" clip-path="url(#mono-clip)">
          ${[40, 80, 120, 160, 200].map(v =>
            `<line x1="${v}" y1="0" x2="${v}" y2="240"/><line x1="0" y1="${v}" x2="240" y2="${v}"/>`).join('')}
        </g>
        <circle class="mono-ring mono-ring--out" cx="120" cy="120" r="104"/>
        <circle class="mono-ring mono-ring--in"  cx="120" cy="120" r="88"/>
        <g class="mono-ticks">
          ${[0, 90, 180, 270].map(a =>
            `<line x1="120" y1="4" x2="120" y2="22" transform="rotate(${a} 120 120)"/>`).join('')}
        </g>
        <text class="mono-txt" x="120" y="120" text-anchor="middle" dominant-baseline="central">${escapeHtml(initials)}</text>
      </svg>
      <span class="mono-tag">SIGNATURE</span>`;
    container.appendChild(box);
  }

  /* ================================================================
     03 — TIMELINE
     ================================================================ */
  const TL = {
    minW: 215,          // largeur mini d'un clip
    maxW: 470,          // largeur maxi d'un clip
    gap: 14,            // espace entre deux clips d'une même piste
    stagger: 0.5,       // décalage entre pistes (0 = aligné, 1 = à la suite)
    curve: 0.45,        // compression de l'échelle des durées
    zoom: 1
  };

  let projects = [];
  let tracks = [];

  function buildTimeline(pf = {}) {
    setText('tl-title', pf.sectionTitle || 'Timeline');
    setText('tl-sub', pf.sectionSubtitle || '');
    setText('tl-cta-text', pf.hint || 'Cliquez un clip pour ouvrir le projet');

    projects = pf.projects || [];
    setText('tl-count', `${SEQ.pad(projects.length)} CLIPS`);

    // Pistes : déclarées dans le JSON, sinon déduites des projets
    tracks = (pf.tracks && pf.tracks.length)
      ? pf.tracks
      : [...new Set(projects.map(p => p.track || 'V1'))].map(id => ({ id, label: id, name: '' }));

    const heads = document.getElementById('tl-heads');
    const inner = document.getElementById('tl-inner');
    if (!heads || !inner) return;

    // En-têtes de pistes
    tracks.forEach(t => {
      const h = el('div', 'tl-head');
      h.innerHTML = `<span class="id">${escapeHtml(t.label || t.id)}</span>
        <span class="nm">${escapeHtml(t.name || '')}</span>
        <span class="toggles"><i>M</i><i>S</i><i>◉</i></span>`;
      heads.appendChild(h);
    });
    const ah = el('div', 'tl-head tl-head--audio');
    ah.innerHTML = `<span class="id">A1</span><span class="nm">Sound design</span>`;
    heads.appendChild(ah);

    // Pistes vidéo + clips
    tracks.forEach(t => {
      const lane = el('div', 'tl-lane');
      lane.dataset.track = t.id;
      lane.setAttribute('data-label', `${t.label || t.id} · ${t.name || ''}`);
      lane.setAttribute('role', 'list');
      projects.filter(p => (p.track || tracks[0].id) === t.id)
              .forEach(p => lane.appendChild(makeClip(p)));
      inner.appendChild(lane);
    });

    // Piste audio décorative
    const audio = el('div', 'tl-lane tl-lane--audio');
    audio.innerHTML = '<canvas class="tl-wave" id="tl-wave" aria-hidden="true"></canvas>';
    inner.appendChild(audio);

    layoutTimeline();
    initTimelineControls();
    initClipEntrance();
  }

  /**
   * Quand la timeline arrive à l'écran, les clips apparaissent en cascade et
   * le premier reçoit un anneau d'attention autour de son bouton de lecture.
   * Le mouvement est le signal le plus fort pour dire « ces blocs sont vivants ».
   */
  function initClipEntrance() {
    const frame = document.getElementById('tl-frame');
    const inner = document.getElementById('tl-inner');
    if (!frame || !inner) return;

    const ordered = projects
      .map(p => inner.querySelector(`.clip[data-id="${CSS.escape(p.id)}"]`))
      .filter(Boolean);

    const revealAll = (stagger) => {
      ordered.forEach((clip, i) => {
        setTimeout(() => { clip.dataset.in = 'true'; }, stagger ? i * 90 : 0);
      });
      if (!stagger) return;
      // Anneau d'attention sur le premier clip, une fois la cascade terminée
      setTimeout(() => {
        const first = ordered[0];
        if (!first) return;
        first.dataset.nudge = 'true';
        setTimeout(() => { delete first.dataset.nudge; }, 8200);
      }, ordered.length * 90 + 320);
    };

    if (reduceMotion || !('IntersectionObserver' in window)) { revealAll(false); return; }

    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { revealAll(true); io.disconnect(); }
    }, { threshold: 0.18 });
    io.observe(frame);
  }

  /**
   * Image de fond d'un clip, par ordre de priorité :
   *   1. timelineImage — image dédiée à la timeline
   *   2. thumbnail     — vignette du projet
   *   3. la miniature YouTube de la première vidéo
   */
  function clipImage(p) {
    if (p.timelineImage) return p.timelineImage;
    if (p.thumbnail) return p.thumbnail;
    // On balaie toutes les vidéos : la première n'est pas toujours sur YouTube.
    // hqdefault existe toujours, contrairement à maxresdefault.
    for (const v of (p.videos || [])) {
      const id = parseYouTube(v?.youtubeId) || parseYouTube(v?.url);
      if (id) return ytThumb(id);
    }
    const own = parseYouTube(p.youtubeId);
    return own ? ytThumb(own) : '';
  }

  function makeClip(p) {
    const a = el('a', 'clip');
    a.href = `project.html?id=${encodeURIComponent(p.id)}`;
    a.dataset.id = p.id;
    a.setAttribute('role', 'listitem');
    a.setAttribute('aria-label', `${p.title} — ${p.year}`);
    a.dataset.cursor = 'play';
    a.dataset.cursorLabel = 'OUVRIR LE CLIP';
    if (p.color) a.style.setProperty('--c', p.color);

    const nbVideos = (p.videos || []).length;
    const img = clipImage(p);

    a.dataset.in = 'false';

    a.innerHTML = `
      ${img ? `<div class="clip-thumb" style="background-image:url('${escapeHtml(img)}')"></div>` : '<div class="clip-thumb clip-thumb--empty"></div>'}
      <div class="clip-prev-slot"></div>
      <div class="clip-scrim" aria-hidden="true"></div>
      <div class="clip-perf clip-perf--t" aria-hidden="true"></div>
      <div class="clip-perf clip-perf--b" aria-hidden="true"></div>
      <span class="clip-open" aria-hidden="true">
        <svg viewBox="0 0 16 16"><path d="M3 2l11 6-11 6z"/></svg>
      </span>
      <div class="clip-body">
        <div class="clip-top">
          <span class="swatch" aria-hidden="true"></span>
          <span>${escapeHtml(p.category || '')}</span>
        </div>
        <div class="clip-title">${escapeHtml(p.title || '')}</div>
        <div class="clip-meta">
          <span>${escapeHtml(p.year || '')}</span>
          <span class="clip-cta">Ouvrir ↗</span>
          <span class="n">${escapeHtml(p.duration || '')}${nbVideos > 1 ? ` · ${nbVideos} v.` : ''}</span>
        </div>
      </div>`;

    attachPreview(a, p);
    return a;
  }

  /**
   * Prévisualisation au survol.
   * `preview` accepte un fichier vidéo OU un lien YouTube. Rien n'est chargé
   * tant que la souris n'est pas restée un court instant sur le clip, pour
   * éviter d'ouvrir six lecteurs en balayant la timeline.
   */
  function attachPreview(clip, p) {
    const src = p.preview;
    if (!src || reduceMotion) return;

    const slot = clip.querySelector('.clip-prev-slot');
    if (!slot) return;

    const ytId = parseYouTube(src);
    if (!ytId && !isVideoFile(src)) return;

    let node = null;
    let timer = null;

    const start = () => {
      timer = setTimeout(() => {
        if (!node) {
          if (ytId) {
            node = el('iframe', 'clip-prev');
            node.setAttribute('tabindex', '-1');
            node.setAttribute('aria-hidden', 'true');
            node.setAttribute('allow', 'autoplay; encrypted-media');
            // Pas de loop+playlist ici non plus : incompatible avec les vidéos non répertoriées
            node.src = ytEmbed(ytId, {
              autoplay: '1', mute: '1', controls: '0', disablekb: '1', fs: '0'
            });
          } else {
            node = el('video', 'clip-prev');
            node.muted = true; node.loop = true; node.playsInline = true;
            node.setAttribute('aria-hidden', 'true');
            node.src = src;
          }
          slot.appendChild(node);
        }
        node.play?.().catch(() => {});
        clip.dataset.playing = 'true';
      }, 260);
    };

    const stop = () => {
      clearTimeout(timer);
      clip.dataset.playing = 'false';
      if (!node) return;
      if (node.tagName === 'VIDEO') node.pause();
      else { node.remove(); node = null; }   // un iframe ne se met pas en pause
    };

    clip.addEventListener('pointerenter', start);
    clip.addEventListener('pointerleave', stop);
    clip.addEventListener('focus', start);
    clip.addEventListener('blur', stop);
  }

  /**
   * Positionne les clips.
   * · La largeur reflète la durée (échelle compressée pour rester lisible).
   * · Les projets sont posés dans l'ordre du JSON sur une frise commune :
   *   un clip démarre à mi-parcours du précédent, ce qui décale les pistes
   *   entre elles comme dans un vrai montage, sans jamais les superposer
   *   à l'intérieur d'une même piste.
   */
  function layoutTimeline() {
    const inner = document.getElementById('tl-inner');
    if (!inner) return;

    const durations = projects.map(p => parseDuration(p.duration));
    const maxSecs = Math.max(1, ...durations);

    const widthFor = secs => {
      const ratio = maxSecs ? Math.pow(Math.max(0, secs) / maxSecs, TL.curve) : 0;
      return Math.round((TL.minW + (TL.maxW - TL.minW) * ratio) * TL.zoom);
    };

    const laneCursor = {};   // fin du dernier clip de chaque piste
    let cursor = TL.gap;     // frise commune
    let maxRight = 0;

    projects.forEach((p, i) => {
      const trackId = p.track || tracks[0]?.id;
      const clip = inner.querySelector(`.clip[data-id="${CSS.escape(p.id)}"]`);
      if (!clip) return;

      const w = widthFor(durations[i]);
      const x = Math.round(Math.max(cursor, laneCursor[trackId] ?? TL.gap));

      clip.style.setProperty('--x', x + 'px');
      clip.style.setProperty('--w', w + 'px');

      laneCursor[trackId] = x + w + TL.gap;
      cursor = x + Math.round(w * TL.stagger);
      maxRight = Math.max(maxRight, x + w + TL.gap);
    });

    const total = Math.max(maxRight, 640);
    inner.style.width = total + 'px';

    buildRuler(total);
    const wave = document.getElementById('tl-wave');
    if (wave) {
      wave.style.width = total + 'px';
      requestAnimationFrame(() => drawWaveform(wave, 'seq-audio-track', 'rgba(255,255,255,0.32)'));
    }
  }

  function buildRuler(totalPx) {
    const ruler = document.getElementById('tl-ruler');
    if (!ruler) return;
    ruler.innerHTML = '';
    const stepPx = 120;
    // Échelle indicative : 120 px = 10 secondes de séquence
    const secPerPx = 10 / (stepPx * TL.zoom);
    for (let x = 0; x <= totalPx; x += stepPx) {
      const major = (x / stepPx) % 2 === 0;
      const tick = el('div', 'tl-tick' + (major ? ' tl-tick--major' : ''));
      tick.style.left = x + 'px';
      if (major) tick.innerHTML = `<span>${toTimecode(x * secPerPx).slice(0, 8)}</span>`;
      ruler.appendChild(tick);
    }
  }

  function initTimelineControls() {
    const scroll = document.getElementById('tl-scroll');
    if (!scroll) return;

    // La molette verticale n'est jamais détournée : la page défile normalement.
    // Maj + molette et le geste horizontal du trackpad sont gérés nativement
    // par le navigateur sur ce conteneur.

    // Défilement au clavier quand la timeline a le focus
    scroll.addEventListener('keydown', e => {
      const stepBy = e.shiftKey ? 600 : 240;
      if (e.key === 'ArrowRight') { e.preventDefault(); scroll.scrollBy({ left: stepBy, behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); scroll.scrollBy({ left: -stepBy, behavior: 'smooth' }); }
      if (e.key === 'Home')       { e.preventDefault(); scroll.scrollTo({ left: 0, behavior: 'smooth' }); }
      if (e.key === 'End')        { e.preventDefault(); scroll.scrollTo({ left: scroll.scrollWidth, behavior: 'smooth' }); }
    });

    // Glisser-déposer pour naviguer
    let dragging = false, startX = 0, startScroll = 0, moved = 0;
    scroll.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return; // natif sur mobile
      dragging = true; moved = 0;
      startX = e.clientX; startScroll = scroll.scrollLeft;
    });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const d = e.clientX - startX;
      moved = Math.abs(d);
      if (moved > 4) scroll.scrollLeft = startScroll - d;
    });
    window.addEventListener('pointerup', e => {
      if (dragging && moved > 6) {
        // Empêche l'ouverture du clip après un vrai glissé
        const blocker = ev => { ev.preventDefault(); ev.stopPropagation(); };
        window.addEventListener('click', blocker, { capture: true, once: true });
      }
      dragging = false;
    });

    // Zoom
    const apply = z => { TL.zoom = Math.max(0.55, Math.min(2.2, z)); layoutTimeline(); };
    document.getElementById('tl-in')?.addEventListener('click', () => apply(TL.zoom * 1.25));
    document.getElementById('tl-out')?.addEventListener('click', () => apply(TL.zoom / 1.25));

    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layoutTimeline, 180); });
  }

  /* ================================================================
     04 — LIVRAISON
     ================================================================ */
  function buildDeliver(contact = {}) {
    setText('del-title', contact.sectionTitle || 'Contact');
    setText('del-sub', contact.sectionSubtitle || '');

    /* L'adresse n'est jamais écrite en clair dans le HTML : elle est
       reconstruite au moment du clic. Invisible pour les aspirateurs à
       adresses, transparente pour le visiteur. (points 7 et 16) */
    const address = contact.email || '';
    const blob = address ? SEQ.encodeEmail(address) : '';
    const readEmail = () => SEQ.decodeEmail(blob);

    /** Ouvre le client mail sans jamais remplacer la page en cours */
    function openMail(e) {
      e?.preventDefault();
      const to = readEmail();
      if (!to) return;
      const subject = encodeURIComponent(contact.mailSubject || 'Prise de contact — portfolio');
      const win = window.open(`mailto:${to}?subject=${subject}`, '_blank');
      // Si aucun client mail n'est configuré, la fenêtre se ferme aussitôt :
      // on bascule alors sur la copie de l'adresse.
      setTimeout(() => {
        if (!win || win.closed || typeof win.closed === 'undefined') copyEmail();
      }, 600);
    }

    async function copyEmail(btn) {
      const to = readEmail();
      try {
        await navigator.clipboard.writeText(to);
        flash(btn, 'Adresse copiée ✓');
      } catch {
        flash(btn, to);
      }
    }

    function flash(btn, msg) {
      const s = btn?.querySelector('span');
      if (!s) return;
      const old = s.textContent;
      s.textContent = msg;
      setTimeout(() => { s.textContent = old; }, 2200);
    }

    const mail = document.getElementById('del-mail');
    if (mail && address) {
      mail.href = '#';
      mail.textContent = address;          // affiché, mais absent de la source servie
      mail.dataset.cursor = 'link';
      mail.dataset.cursorLabel = 'ÉCRIRE';
      mail.addEventListener('click', openMail);
    }

    const actions = document.getElementById('del-actions');
    if (actions && address) {
      const a = el('button', 'btn btn-accent');
      a.type = 'button';
      a.dataset.cursor = 'link';
      a.innerHTML = `<span>${escapeHtml(contact.emailLabel || 'Envoyer un message')}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 7h9.2L7.6 3.4 9 2l6 6-6 6-1.4-1.4L11.2 9H2z"/></svg>`;
      a.addEventListener('click', openMail);
      actions.appendChild(a);

      const copy = el('button', 'btn');
      copy.type = 'button';
      copy.dataset.cursor = 'link';
      copy.innerHTML = '<span>Copier l\'adresse</span>';
      copy.addEventListener('click', () => copyEmail(copy));
      actions.appendChild(copy);
    }

    const box = document.getElementById('del-socials');
    if (box) {
      (contact.socials || []).forEach(s => {
        const a = el('a', 'dest');
        a.href = s.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.setAttribute('role', 'listitem');
        a.dataset.cursor = 'link';
        a.innerHTML = `${socialIcon(s.icon)}<span class="nm">${escapeHtml(s.name)}</span><span class="ar">↗</span>`;
        box.appendChild(a);
      });
    }
  }

  /* ================================================================
     DOCK — playhead, timecode, scrubbing
     ================================================================ */
  function initDock(nav = []) {
    const scrub    = document.getElementById('dock-scrub');
    const ruler    = document.getElementById('dock-ruler');
    const head     = document.getElementById('playhead');
    const progress = document.getElementById('dock-progress');
    const tbTc     = document.getElementById('tb-tc');
    const sections = nav.map(n => document.getElementById(n.target)).filter(Boolean);

    // Segments = sections
    if (ruler) {
      nav.forEach(n => {
        const seg = el('div', 'dock-seg');
        seg.dataset.target = n.target;
        seg.innerHTML = `<span class="name">${escapeHtml(n.code || '')} · ${escapeHtml(n.label)}</span><span class="bar"></span>`;
        ruler.appendChild(seg);
      });
    }

    // La « durée » de la séquence est proportionnelle à la hauteur du document
    const totalSecs = () => Math.max(30, (document.body.scrollHeight / window.innerHeight) * 24);

    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

      if (head) head.style.transform = `translateX(${p * (scrub?.clientWidth || 0)}px)`;
      if (progress) progress.style.width = (p * 100) + '%';
      if (tbTc) tbTc.textContent = toTimecode(p * totalSecs());

      // Section active
      const mid = window.scrollY + window.innerHeight * 0.35;
      let current = sections[0]?.id;
      sections.forEach(s => { if (s.offsetTop <= mid) current = s.id; });

      document.querySelectorAll('.tb-nav a').forEach(a =>
        a.setAttribute('aria-current', String(a.dataset.target === current)));
      document.querySelectorAll('.dock-seg').forEach(s =>
        s.setAttribute('data-active', String(s.dataset.target === current)));
    }

    setText('dk-total', toTimecode(totalSecs()));

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });

    window.addEventListener('resize', () => {
      setText('dk-total', toTimecode(totalSecs()));
      update();
    });

    // Scrubbing : cliquer / glisser sur la barre déplace la page
    if (scrub) {
      const seek = clientX => {
        const r = scrub.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: p * max, behavior: reduceMotion ? 'auto' : 'smooth' });
      };
      let down = false;
      scrub.addEventListener('pointerdown', e => { down = true; seek(e.clientX); });
      scrub.addEventListener('pointermove', e => { if (down) seek(e.clientX); });
      window.addEventListener('pointerup', () => { down = false; });
    }

    document.getElementById('dk-top')?.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.getElementById('dk-end')?.addEventListener('click', () =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

    update();
  }

  /* ================================================================
     PIED DE PAGE
     ================================================================ */
  function buildFooter(footer = {}, meta = {}) {
    // {{year}} se met à jour tout seul chaque 1er janvier (point 14)
    setText('foot-credit', (footer.credit || '').replace(/\{\{\s*year\s*\}\}/g, new Date().getFullYear()));
    setText('foot-right', meta.sequenceName ? `${meta.sequenceName} · 24 FPS · REC.709` : '');
  }

  /* ================================================================
     LANCEMENT
     ================================================================ */
  buildMeta(data.meta);
  buildNav(data.nav);
  buildMonitor(data.hero);
  buildRack(data.about);
  buildTimeline(data.portfolio);
  buildDeliver(data.contact);
  buildFooter(data.footer, data.meta);

  initBurger();
  SEQ.initCursor();
  SEQ.initReveal();
  initDock(data.nav || []);

  await bootDone;
  // Recalage après l'apparition (les polices peuvent modifier les hauteurs)
  layoutTimeline();

})();
