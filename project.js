/* ================================================================
   PROJECT.JS — Page projet (moniteur source)
   Lit ?id=… et affiche le projet correspondant depuis data.json
   ================================================================ */
'use strict';

(async function () {

  const { el, setText, escapeHtml, mmss, parseDuration, toTimecode, reduceMotion,
          parseYouTube, isVideoFile, ytEmbed, ytThumb,
          resolveSource, driveDirect, driveEmbed, setYouTubeHost } = SEQ;

  const stage = document.getElementById('stage');
  const errorBox = document.getElementById('pj-error');

  function fail(msg) {
    if (errorBox) {
      errorBox.removeAttribute('hidden');
      if (msg) setText('pj-error-msg', msg);
    }
    stage?.setAttribute('hidden', '');
  }

  /* ── Chargement ── */
  let data;
  try {
    data = await SEQ.loadData();
  } catch (err) {
    console.error(err);
    fail("Impossible de charger data.json. Ouvrez le site via un serveur local (python3 -m http.server 8080).");
    return;
  }

  if (data.meta?.accent) {
    document.documentElement.style.setProperty('--accent', data.meta.accent);
  }
  setYouTubeHost(data.meta?.youtubeHost);

  setText('tb-initials', data.meta?.initials || '');
  setText('tb-seq', data.meta?.sequenceName || '');
  setText('foot-credit', data.footer?.credit || '');
  setText('foot-right', data.meta?.sequenceName ? `${data.meta.sequenceName} · 24 FPS · REC.709` : '');

  /* ── Recherche du projet ── */
  const projects = data.portfolio?.projects || [];
  const id = new URLSearchParams(location.search).get('id');
  const index = projects.findIndex(p => p.id === id);
  const project = projects[index];

  if (!project) {
    fail(id
      ? `Aucun projet ne correspond à l'identifiant « ${id} ».`
      : "Aucun identifiant de projet dans l'URL.");
    return;
  }

  stage?.removeAttribute('hidden');

  if (project.color) document.documentElement.style.setProperty('--c', project.color);

  /* ================================================================
     EN-TÊTE
     ================================================================ */
  const fullTitle = `${project.title} — ${data.meta?.siteTitle || 'Portfolio'}`;
  document.title = fullTitle;
  setText('page-title', fullTitle);
  document.getElementById('meta-desc')?.setAttribute('content', (project.context || '').slice(0, 160));

  setText('pj-crumb-current', project.title);
  setText('pj-title', project.title);
  setText('pj-role', project.role || '');

  const tags = document.getElementById('pj-tags');
  if (tags) {
    if (project.category) {
      const t = el('span', 'pj-tag');
      if (project.color) t.style.setProperty('--c', project.color);
      t.innerHTML = `<span class="sw" aria-hidden="true"></span>${escapeHtml(project.category)}`;
      tags.appendChild(t);
    }
    if (project.track) {
      tags.appendChild(el('span', 'pj-tag', `PISTE ${escapeHtml(project.track)}`));
    }
    tags.appendChild(el('span', 'pj-tag pj-tag--accent', `CLIP ${SEQ.pad(index + 1)}/${SEQ.pad(projects.length)}`));
  }

  const headMeta = document.getElementById('pj-head-meta');
  if (headMeta) {
    const cells = [
      { k: 'Année',  v: project.year },
      { k: 'Durée',  v: project.duration },
      { k: 'Client', v: project.client }
    ].filter(c => c.v);
    cells.forEach(c => {
      const n = el('div', 'pj-hm');
      n.innerHTML = `<div class="k">${escapeHtml(c.k)}</div><div class="v">${escapeHtml(c.v)}</div>`;
      headMeta.appendChild(n);
    });
  }

  /* ================================================================
     LECTEUR + CHUTIER
     ================================================================ */
  const videos = (project.videos && project.videos.length)
    ? project.videos
    : (project.youtubeId ? [{ youtubeId: project.youtubeId, title: project.title }] : []);

  const player = document.getElementById('pj-player');
  let currentIdx = 0;

  /**
   * Une vidéo peut être décrite par un lien YouTube, un lien Google Drive
   * ou un fichier, indifféremment dans "youtubeId", "url" ou "src".
   */
  const sourceOf = v => resolveSource(v?.youtubeId, v?.url, v?.src);

  function posterFor(v) {
    const s = sourceOf(v);
    return s.kind === 'youtube' ? ytThumb(s.id)
                                : (project.timelineImage || project.thumbnail || '');
  }

  /** Bandeau d'information affiché sous le lecteur */
  function setNotice(html) {
    const box = document.getElementById('pj-notice');
    if (!box) return;
    if (!html) { box.setAttribute('hidden', ''); box.innerHTML = ''; return; }
    box.innerHTML = html;
    box.removeAttribute('hidden');
  }

  /**
   * Google Drive : on tente d'abord le fichier brut, qui conserve la
   * résolution d'origine. Le lecteur Drive retranscode et tombe à 360p sur
   * les formats larges (les écrans de la Défense font 7488×1920). S'il refuse
   * le flux direct — quota, analyse antivirus — on bascule sur son lecteur
   * en prévenant que la qualité est dégradée. (point 12)
   */
  function playDrive(id, v, autoplay) {
    const vid = document.createElement('video');
    vid.controls = true;
    vid.playsInline = true;
    vid.preload = 'metadata';
    vid.setAttribute('style', 'width:100%;height:100%;object-fit:contain;background:#000');
    const poster = posterFor(v);
    if (poster) vid.poster = poster;
    if (autoplay) { vid.autoplay = true; vid.muted = true; }
    vid.src = driveDirect(id);

    let settled = false;
    const fallback = (why) => {
      if (settled) return;
      settled = true;
      player.innerHTML = `<iframe src="${driveEmbed(id)}"
        title="${escapeHtml(v.title || project.title)}"
        allow="autoplay" allowfullscreen loading="lazy"></iframe>`;
      setNotice(`<span class="pj-notice-dot" aria-hidden="true"></span>
        <strong>Lecture de secours</strong>
        <span>Le fichier d'origine n'a pas pu être diffusé (${escapeHtml(why)}).
        La vidéo passe par le lecteur Google Drive : la qualité est réduite et le
        chargement peut être plus lent. La version haute définition reste
        accessible depuis le lien de téléchargement.</span>
        <a href="${driveEmbed(id)}" target="_blank" rel="noopener">Ouvrir sur Drive ↗</a>`);
    };

    vid.addEventListener('error', () => fallback('flux direct refusé'));
    vid.addEventListener('loadeddata', () => { settled = true; setNotice(''); });
    // Drive répond parfois par une page HTML au lieu de la vidéo : silence = échec
    setTimeout(() => { if (!settled && !vid.videoHeight) fallback('délai dépassé'); }, 9000);

    player.innerHTML = '';
    player.appendChild(vid);
  }

  function play(i, autoplay = false) {
    const v = videos[i];
    if (!v || !player) return;
    currentIdx = i;
    setNotice('');

    const src = sourceOf(v);

    if (src.kind === 'youtube') {
      player.innerHTML = `<iframe
        src="${ytEmbed(src.id, Object.assign({ cc_load_policy: '0' }, autoplay ? { autoplay: '1' } : {}))}"
        title="${escapeHtml(v.title || project.title)}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen loading="lazy"></iframe>`;
    } else if (src.kind === 'drive') {
      playDrive(src.id, v, autoplay);
    } else if (src.kind === 'file') {
      player.innerHTML = `<video src="${escapeHtml(src.url)}" controls playsinline
        poster="${escapeHtml(posterFor(v))}" style="width:100%;height:100%;object-fit:contain"></video>`;
    } else {
      // Cas DOLORES : projet annoncé, vidéo pas encore disponible (point 15)
      player.innerHTML = `<div class="pj-noembed">
        <strong>Bientôt disponible</strong>
        <span>Cette vidéo n'est pas encore en ligne.</span></div>`;
    }

    updateInspector(i);

    setText('pj-np-idx', `V${SEQ.pad(i + 1)}`);
    setText('pj-np-title', v.title || project.title);
    setText('pj-np-desc', v.description || '');
    setText('pj-np-dur', v.duration || '');
    setText('pj-clip-code', `${(project.id || '').toUpperCase()} · V${SEQ.pad(i + 1)}`);

    document.querySelectorAll('.bin-item').forEach((b, bi) =>
      b.setAttribute('aria-current', String(bi === i)));
  }

  const bin = document.getElementById('pj-bin');
  const binWrap = document.getElementById('pj-bin-wrap');

  if (videos.length <= 1) {
    binWrap?.setAttribute('hidden', '');
    document.querySelector('.pj-grid')?.style.setProperty('grid-template-columns', 'minmax(0,1fr)');
  } else if (bin) {
    setText('pj-bin-count', `${SEQ.pad(videos.length)} ÉLÉMENTS`);
    videos.forEach((v, i) => {
      const b = el('button', 'bin-item');
      b.type = 'button';
      b.setAttribute('role', 'listitem');
      b.setAttribute('aria-current', String(i === 0));
      b.dataset.cursor = 'play';
      b.dataset.cursorLabel = 'LIRE';
      b.innerHTML = `
        <span class="bin-idx">${SEQ.pad(i + 1)}</span>
        <span class="bin-thumb" style="background-image:url('${escapeHtml(posterFor(v))}')">
          <span class="bin-play"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2l11 6-11 6z"/></svg></span>
        </span>
        <span class="bin-txt">
          <span class="bin-title">${escapeHtml(v.title || 'Sans titre')}</span>
          <span class="bin-sub">${escapeHtml(v.duration || '—')}</span>
        </span>`;
      b.addEventListener('click', () => play(i, true));
      bin.appendChild(b);
    });
  }

  play(0, false);

  /* ================================================================
     INSPECTEUR
     ================================================================ */
  setText('pj-context', project.context || '');

  const toolsBox = document.getElementById('pj-tools');
  if (toolsBox) {
    (project.tools || []).forEach(t => toolsBox.appendChild(el('span', 'pj-tool', escapeHtml(t))));
    if (!(project.tools || []).length) toolsBox.remove();
  }

  /**
   * Inspecteur : la moitié haute décrit la vidéo sélectionnée, la moitié
   * basse décrit le projet. Il se met à jour à chaque changement de clip
   * dans le chutier. (points 2, 11 et 17)
   */
  function updateInspector(i) {
    const dl = document.getElementById('pj-dl');
    if (!dl) return;
    const v = videos[i] || {};
    const src = sourceOf(v);
    const cumul = videos.reduce((a, x) => a + parseDuration(x.duration), 0);

    const HOSTS = { youtube: 'YouTube', drive: 'Google Drive', file: 'Fichier', none: '—' };

    const rows = [
      ['__sep', 'Vidéo sélectionnée'],
      ['Titre',        v.title],
      ['Position',     videos.length ? `${SEQ.pad(i + 1)} / ${SEQ.pad(videos.length)}` : null],
      ['Durée',        v.duration],
      ['Hébergement',  HOSTS[src.kind]],

      ['__sep', 'Projet'],
      ['Référence',    (project.id || '').toUpperCase()],
      ['Catégorie',    project.category],
      ['Rôle',         project.role],
      ['Client',       project.client],
      ['Année',        project.year],
      ['Piste',        project.track],
      ['Éléments',     videos.length ? `${SEQ.pad(videos.length)} vidéo${videos.length > 1 ? 's' : ''}` : null],
      // Une seule ligne de durée totale : plus de « master » contradictoire (point 11)
      ['Durée totale', cumul ? mmss(cumul) : project.duration]
    ].filter(r => r[1]);

    dl.innerHTML = '';
    rows.forEach(([k, val]) => {
      if (k === '__sep') {
        dl.appendChild(el('div', 'pj-dl-sep', escapeHtml(val)));
        return;
      }
      const row = document.createElement('div');
      row.innerHTML = `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(val)}</dd>`;
      dl.appendChild(row);
    });
  }

  /* ================================================================
     CLIPS ADJACENTS
     ================================================================ */
  function adjacent(btnId, p) {
    const btn = document.getElementById(btnId);
    if (!btn || !p) return;
    btn.href = `project.html?id=${encodeURIComponent(p.id)}`;
    btn.querySelector('.t').textContent = p.title;
    btn.dataset.cursor = 'link';
    btn.removeAttribute('hidden');
  }
  adjacent('pj-prev', projects[index - 1]);
  adjacent('pj-next', projects[index + 1]);

  // Flèches clavier
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowLeft'  && projects[index - 1]) location.href = `project.html?id=${encodeURIComponent(projects[index - 1].id)}`;
    if (e.key === 'ArrowRight' && projects[index + 1]) location.href = `project.html?id=${encodeURIComponent(projects[index + 1].id)}`;
  });

  /* ================================================================
     CHROME
     ================================================================ */
  SEQ.initCursor();
  SEQ.initReveal();

  // Timecode de la barre supérieure calé sur le scroll de la page
  const tbTc = document.getElementById('tb-tc');
  const totalSecs = () => Math.max(24, (document.body.scrollHeight / window.innerHeight) * 24);
  const updateTc = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (tbTc) tbTc.textContent = toTimecode(p * totalSecs());
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateTc(); ticking = false; });
  }, { passive: true });
  updateTc();

})();
