/* ================================================================
   APP.JS — Dynamic Portfolio Engine (index.html)
   Vanilla JS, data-driven from data.json
   ================================================================ */

'use strict';

/* ── SVG ICON MAP for social networks ── */
const SOCIAL_ICONS = {
  linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  vimeo:    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.787 4.789.968 5.507.537 2.443 1.124 3.664 1.762 3.664.498 0 1.246-.787 2.249-2.361 1-.578 1.532-2.575 1.532-2.956 0-.78-.301-1.168-.991-1.168-.354 0-.724.08-1.08.241.717-2.34 2.081-3.482 4.093-3.419 1.494.045 2.199 1.01 2.113 2.9z"/></svg>`,
  youtube:  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  instagram:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  behance:  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.34 1.05.34 1.73 0 .74-.17 1.36-.507 1.86-.338.5-.837.9-1.502 1.22.906.26 1.576.72 2.022 1.37.448.66.665 1.45.665 2.36 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-1.16 1.35-.49.348-1.065.604-1.72.754-.655.15-1.35.222-2.08.222H0V4.503h6.938zm-.41 5.32c.59 0 1.07-.14 1.44-.42.37-.28.55-.72.55-1.3 0-.33-.07-.6-.19-.82-.12-.22-.28-.39-.49-.51-.2-.12-.44-.2-.7-.24-.27-.04-.55-.06-.84-.06H3.5v3.35h3.03zm.16 5.54c.32 0 .62-.03.9-.09.28-.06.52-.16.72-.3.2-.15.36-.34.48-.58.12-.24.17-.55.17-.93 0-.73-.2-1.25-.61-1.57-.4-.32-.94-.47-1.61-.47H3.5V15.363h3.188zm9.162-9.64c.71 0 1.36.13 1.96.38.59.25 1.1.6 1.52 1.04.42.45.74.98.97 1.6.23.62.34 1.3.34 2.04v.84H12.34c.03.8.27 1.42.72 1.86.45.44 1.06.66 1.84.66.61 0 1.12-.15 1.54-.44.42-.29.66-.6.72-.95h2.96c-.47 1.37-1.17 2.34-2.12 2.92-.95.58-2.1.86-3.44.86-.93 0-1.77-.15-2.52-.45-.75-.3-1.38-.72-1.91-1.27-.52-.55-.93-1.22-1.2-2-.28-.78-.42-1.65-.42-2.61 0-.93.15-1.78.45-2.56.3-.77.72-1.44 1.26-2 .55-.56 1.2-.99 1.96-1.3.76-.31 1.6-.47 2.52-.47zm.04 2.28c-.67 0-1.22.2-1.65.58-.43.38-.68.97-.75 1.75h4.64c-.04-.77-.27-1.36-.67-1.74-.4-.38-.92-.59-1.57-.59zm-1.44-4.44h4.66v1.5h-4.66V3.56z"/></svg>`,
};

/* ── Main: fetch data and bootstrap ── */
async function init() {
  let data;
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error('Failed to load data.json:', err);
    return;
  }

  setDocumentMeta(data.meta);
  buildNav(data.nav);
  buildHero(data.hero);
  buildAbout(data.about);
  buildPortfolio(data.portfolio);
  buildContact(data.contact);
  buildFooter(data.footer);

  initScrollspy(data.nav);
  initScrollReveal();
  initNavScroll();
  initMobileMenu();
}

/* ================================================================
   META
   ================================================================ */
function setDocumentMeta({ siteTitle, lang }) {
  document.title = siteTitle;
  document.documentElement.lang = lang;
  const el = document.getElementById('site-title');
  if (el) el.textContent = siteTitle;
}

/* ================================================================
   NAV
   ================================================================ */
function buildNav(navItems) {
  // Desktop nav
  const list = document.getElementById('nav-links');
  // Mobile overlay nav
  const mobileList = document.getElementById('mobile-nav-links');

  navItems.forEach(({ label, target }) => {
    // Desktop
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href = `#${target}`;
    a.textContent = label;
    a.dataset.target = target;
    li.appendChild(a);
    list.appendChild(li);

    // Mobile overlay
    if (mobileList) {
      const mLi = document.createElement('li');
      const mA  = document.createElement('a');
      mA.href = `#${target}`;
      mA.textContent = label;
      mA.dataset.target = target;
      mLi.appendChild(mA);
      mobileList.appendChild(mLi);
    }
  });

  // Set tagline in mobile footer
  const taglineEl = document.getElementById('mobile-menu-tagline');
  const titleEl   = document.getElementById('site-title');
  if (taglineEl && titleEl) {
    taglineEl.textContent = titleEl.textContent;
  }
}

/* ================================================================
   HERO
   ================================================================ */
function buildHero({ firstName, lastName, tagline, ctaLabel, showreelUrl }) {
  const video = document.getElementById('hero-video');
  video.src = showreelUrl;

  document.getElementById('hero-tagline').textContent = tagline;
  document.getElementById('hero-name').textContent    = `${firstName} ${lastName}`;

  const cta = document.getElementById('hero-cta');
  cta.textContent = ctaLabel;
}

/* ================================================================
   ABOUT
   ================================================================ */
function buildAbout({ photo, photoAlt, bio, skills, cvUrl, cvLabel }) {
  const img = document.getElementById('about-photo');
  img.src = photo;
  img.alt = photoAlt;

  document.getElementById('about-bio').textContent = bio;

  const grid = document.getElementById('skills-grid');
  skills.forEach(({ name, icon }) => {
    const tag = document.createElement('div');
    tag.className = 'skill-tag';
    tag.setAttribute('role', 'listitem');

    // Icon: try img, fallback to colored dot
    if (icon) {
      const img = document.createElement('img');
      img.src   = icon;
      img.alt   = '';
      img.width = 18;
      img.height = 18;
      img.onerror = function () {
        this.replaceWith(makeSkillFallbackIcon());
      };
      tag.appendChild(img);
    } else {
      tag.appendChild(makeSkillFallbackIcon());
    }

    const span = document.createElement('span');
    span.textContent = name;
    tag.appendChild(span);
    grid.appendChild(tag);
  });

  const cvBtn = document.getElementById('about-cv');
  cvBtn.href = cvUrl;
  cvBtn.textContent = cvLabel;
  cvBtn.setAttribute('aria-label', `${cvLabel} (PDF)`);
}

function makeSkillFallbackIcon() {
  const span = document.createElement('span');
  span.className = 'skill-icon-fallback';
  span.setAttribute('aria-hidden', 'true');
  return span;
}

/* ================================================================
   PORTFOLIO
   ================================================================ */
function buildPortfolio({ sectionTitle, sectionSubtitle, projects }) {
  document.getElementById('portfolio-title').textContent    = sectionTitle;
  document.getElementById('portfolio-subtitle').textContent = sectionSubtitle;

  const grid = document.getElementById('masonry-grid');

  projects.forEach((project, index) => {
    const card = buildProjectCard(project, index);
    grid.appendChild(card);
  });
}

function buildProjectCard(project, index) {
  const { id, title, year, category, thumbnail, videos = [] } = project;

  const card = document.createElement('article');
  card.className = 'project-card reveal';
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${title} — ${category}, ${year}`);

  const delay = Math.min(index, 5) * 0.08;
  card.style.transitionDelay = `${delay}s`;

  // Thumbnail
  const thumb = document.createElement('img');
  thumb.className = 'project-thumb';
  thumb.src = thumbnail;
  thumb.alt = `Miniature du projet : ${title}`;
  thumb.loading = 'lazy';
  thumb.onerror = function () {
    this.src = generatePlaceholderSVG(title);
  };
  card.appendChild(thumb);

  // Play icon
  const playIcon = document.createElement('div');
  playIcon.className = 'project-play-icon';
  playIcon.setAttribute('aria-hidden', 'true');
  card.appendChild(playIcon);

  // Video count badge (when > 1 video)
  if (videos.length > 1) {
    const badge = document.createElement('span');
    badge.className = 'project-video-count';
    badge.setAttribute('aria-label', `${videos.length} vidéos`);
    badge.textContent = `${videos.length} vidéos`;
    card.appendChild(badge);
  }

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'project-overlay';
  overlay.innerHTML = `
    <p class="project-category">${escapeHtml(category)}</p>
    <h3 class="project-name">${escapeHtml(title)}</h3>
    <p class="project-year">${escapeHtml(year)}</p>
  `;
  card.appendChild(overlay);

  // Click / keyboard → navigate to project detail page
  const navigate = () => {
    window.location.href = `project.html?id=${encodeURIComponent(id)}`;
  };
  card.addEventListener('click', navigate);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(); }
  });

  return card;
}

/** Inline SVG data URI as img fallback when thumbnail is missing */
function generatePlaceholderSVG(title) {
  const letter = title.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">
    <rect width="400" height="225" fill="#181818"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      font-family="sans-serif" font-size="72" fill="rgba(229,201,126,0.35)">${letter}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/* ================================================================
   CONTACT  (modal functions removed — project detail is project.html)
   ================================================================ */
function buildContact({ sectionTitle, sectionSubtitle, email, emailLabel, socials }) {
  document.getElementById('contact-title').textContent    = sectionTitle;
  document.getElementById('contact-subtitle').textContent = sectionSubtitle;

  const emailBtn = document.getElementById('contact-email-btn');
  emailBtn.href = `mailto:${email}`;
  emailBtn.textContent = emailLabel;

  const socialsEl = document.getElementById('socials');
  socials.forEach(({ name, url, icon }) => {
    const a = document.createElement('a');
    a.href   = url;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.className = 'social-link';
    a.setAttribute('role', 'listitem');
    a.setAttribute('aria-label', name);

    const svgIcon = SOCIAL_ICONS[icon] ?? '';
    a.innerHTML   = `${svgIcon}<span>${escapeHtml(name)}</span>`;
    socialsEl.appendChild(a);
  });
}

/* ================================================================
   FOOTER
   ================================================================ */
function buildFooter({ credit }) {
  document.getElementById('footer-credit').textContent = credit;
}

/* ================================================================
   SCROLLSPY
   Observes each section; marks the matching nav link as active
   (adds CSS class that applies text-decoration: line-through)
   ================================================================ */
function initScrollspy(navItems) {
  const sectionIds = navItems.map((n) => n.target);

  // Both desktop and mobile links
  const allNavLinks = document.querySelectorAll(
    '#nav-links a[data-target], #mobile-nav-links a[data-target]'
  );

  const setActive = (id) => {
    allNavLinks.forEach((a) => {
      a.classList.toggle('active', a.dataset.target === id);
    });
  };

  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    {
      root: null,
      rootMargin: `-${Math.round(window.innerHeight * 0.35)}px 0px -${Math.round(window.innerHeight * 0.35)}px 0px`,
      threshold: 0,
    }
  );

  sections.forEach((s) => observer.observe(s));
}

/* ================================================================
   SCROLL REVEAL
   Uses IntersectionObserver to add .visible to .reveal elements
   ================================================================ */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target); // fire once
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((el) => observer.observe(el));
}

/* ================================================================
   NAVBAR SCROLL EFFECT
   ================================================================ */
function initNavScroll() {
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ================================================================
   MOBILE MENU TOGGLE — fullscreen overlay
   ================================================================ */
function initMobileMenu() {
  const toggle = document.getElementById('nav-toggle');
  const menu   = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const openMenu = () => {
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fermer le menu');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close when any mobile link is clicked
  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') closeMenu();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });
}

/* ================================================================
   SECURITY UTILITY — Prevent XSS
   ================================================================ */
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
