/* ================================================================
   PROJECT.JS — Project detail page engine
   Reads ?id= from URL, loads data.json, renders the full page
   ================================================================ */

'use strict';

/* ── YouTube thumbnail URL helper ── */
const ytThumb = (id) =>
  `https://img.youtube.com/vi/${encodeURIComponent(id)}/mqdefault.jpg`;

/* ── YouTube privacy-enhanced embed URL ── */
const ytEmbed = (id) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;

/* ── Current active video index ── */
let activeVideoIndex = 0;

/* ================================================================
   MAIN ENTRY POINT
   ================================================================ */
async function init() {
  // 1. Parse project id from query string
  const params    = new URLSearchParams(window.location.search);
  const projectId = params.get('id');

  if (!projectId) {
    showError();
    return;
  }

  // 2. Fetch data
  let data;
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error('Failed to load data.json:', err);
    showError();
    return;
  }

  // 3. Find the project
  const projects   = data.portfolio.projects;
  const index      = projects.findIndex((p) => p.id === projectId);

  if (index === -1) {
    showError();
    return;
  }

  const project = projects[index];

  // 4. Set document meta
  document.title = `${project.title} — ${data.meta.siteTitle}`;
  document.documentElement.lang = data.meta.lang;

  // 5. Render all sections
  renderHero(project);
  renderPlayer(project);
  renderPlaylist(project);
  renderContext(project);
  renderPrevNext(projects, index);
  renderFooter(data.footer);

  // 6. Update nav logo
  const navLogo = document.getElementById('nav-logo');
  if (navLogo) {
    const nameParts = data.meta.siteTitle.split('—')[0].trim().split(' ');
    if (nameParts.length >= 2) {
      navLogo.textContent = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
  }
}

/* ================================================================
   HERO BANNER
   ================================================================ */
function renderHero({ title, category, year, role, thumbnail }) {
  setText('pj-category', category);
  setText('pj-title', title);
  setText('pj-year', year);
  setText('pj-role', role);

  // Background image from thumbnail
  const bg = document.getElementById('project-hero-bg');
  if (bg && thumbnail) {
    bg.style.backgroundImage = `url('${thumbnail}')`;
  }
}

/* ================================================================
   MAIN PLAYER (first video loads on page open)
   ================================================================ */
function renderPlayer(project) {
  const videos = project.videos ?? [];
  if (!videos.length) return;

  loadVideo(videos[0], 0, videos.length);
}

function loadVideo(video, index, total) {
  activeVideoIndex = index;

  const { youtubeId, title, description = '' } = video;

  // Inject iframe (lazy — only when called)
  const frame = document.getElementById('pj-player-frame');
  frame.innerHTML = '';

  const iframe = document.createElement('iframe');
  iframe.src           = ytEmbed(youtubeId);
  iframe.title         = `Vidéo YouTube : ${title}`;
  iframe.allow         = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  frame.appendChild(iframe);

  // Update info below player
  setText('pj-video-index', `Vidéo ${index + 1} / ${total}`);
  setText('pj-video-title', title);
  setText('pj-video-desc', description);

  // Update active state in playlist
  document.querySelectorAll('.pj-plist-card').forEach((card, i) => {
    card.classList.toggle('active', i === index);
    card.setAttribute('aria-current', i === index ? 'true' : 'false');
  });

  // Scroll to player top (smooth)
  document.getElementById('pj-player-frame')?.closest('.pj-player-section')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ================================================================
   PLAYLIST (hidden if only 1 video)
   ================================================================ */
function renderPlaylist(project) {
  const videos  = project.videos ?? [];
  const section = document.getElementById('pj-playlist-section');

  if (videos.length <= 1) {
    // Hide playlist — hide info strip count too
    section.hidden = true;
    setText('pj-video-index', '');
    return;
  }

  // Heading
  const heading = document.getElementById('pj-playlist-heading');
  if (heading) heading.textContent = `${videos.length} vidéos`;

  const playlist = document.getElementById('pj-playlist');
  playlist.innerHTML = '';

  videos.forEach((video, index) => {
    const card = buildPlaylistCard(video, index, videos.length);
    playlist.appendChild(card);
  });
}

function buildPlaylistCard(video, index, total) {
  const { youtubeId, title } = video;

  const card = document.createElement('div');
  card.className = `pj-plist-card${index === 0 ? ' active' : ''}`;
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-current', index === 0 ? 'true' : 'false');
  card.setAttribute('aria-label', `Vidéo ${index + 1} : ${title}`);

  // Thumbnail (YouTube-provided image)
  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'pj-plist-thumb-wrap';

  const thumb = document.createElement('img');
  thumb.className = 'pj-plist-thumb';
  thumb.src     = ytThumb(youtubeId);
  thumb.alt     = '';
  thumb.loading = 'lazy';
  thumb.onerror = function () {
    this.style.opacity = '0'; // hide broken image gracefully
  };
  thumbWrap.appendChild(thumb);

  const playOverlay = document.createElement('div');
  playOverlay.className = 'pj-plist-play';
  playOverlay.setAttribute('aria-hidden', 'true');
  thumbWrap.appendChild(playOverlay);

  card.appendChild(thumbWrap);

  // Card body
  const body = document.createElement('div');
  body.className = 'pj-plist-body';

  const indexEl = document.createElement('p');
  indexEl.className = 'pj-plist-index';
  indexEl.textContent = `Vidéo ${index + 1}`;

  const titleEl = document.createElement('p');
  titleEl.className = 'pj-plist-title';
  titleEl.textContent = title;

  body.appendChild(indexEl);
  body.appendChild(titleEl);
  card.appendChild(body);

  // Click / keyboard → switch main player
  const activate = () => loadVideo(video, index, total);
  card.addEventListener('click', activate);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
  });

  return card;
}

/* ================================================================
   PROJECT CONTEXT + META DETAILS CARD
   ================================================================ */
function renderContext(project) {
  const { context, title, category, year, role, videos = [] } = project;

  setText('pj-context', context ?? '');

  const dl = document.getElementById('pj-details-list');
  if (!dl) return;

  const items = [
    { label: 'Projet',      value: title },
    { label: 'Catégorie',   value: category },
    { label: 'Année',       value: year },
    { label: 'Rôle',        value: role },
    { label: 'Vidéos',      value: `${videos.length} vidéo${videos.length > 1 ? 's' : ''}` },
  ];

  dl.innerHTML = '';
  items.forEach(({ label, value }) => {
    if (!value) return;
    const div = document.createElement('div');
    div.className = 'pj-detail-item';
    div.innerHTML = `
      <dt class="pj-detail-label">${escapeHtml(label)}</dt>
      <dd class="pj-detail-value">${escapeHtml(value)}</dd>
    `;
    dl.appendChild(div);
  });
}

/* ================================================================
   PREV / NEXT PROJECT NAVIGATION
   ================================================================ */
function renderPrevNext(projects, currentIndex) {
  const prevLink = document.getElementById('pj-prev');
  const nextLink = document.getElementById('pj-next');

  const prev = projects[currentIndex - 1];
  const next = projects[currentIndex + 1];

  if (prev && prevLink) {
    prevLink.href = `project.html?id=${encodeURIComponent(prev.id)}`;
    prevLink.hidden = false;
    prevLink.innerHTML = `
      <span class="pj-nav-direction">← Précédent</span>
      <span class="pj-nav-project-title">${escapeHtml(prev.title)}</span>
    `;
  }

  if (next && nextLink) {
    nextLink.href = `project.html?id=${encodeURIComponent(next.id)}`;
    nextLink.hidden = false;
    nextLink.innerHTML = `
      <span class="pj-nav-direction">Suivant →</span>
      <span class="pj-nav-project-title">${escapeHtml(next.title)}</span>
    `;
  }
}

/* ================================================================
   FOOTER
   ================================================================ */
function renderFooter({ credit }) {
  setText('footer-credit', credit);
}

/* ================================================================
   ERROR STATE
   ================================================================ */
function showError() {
  const main  = document.getElementById('project-main');
  const error = document.getElementById('project-error');
  if (main)  main.hidden = true;
  if (error) error.classList.add('pj-error--visible');
}

/* ================================================================
   UTILITIES
   ================================================================ */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', init);
