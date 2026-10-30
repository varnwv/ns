'use strict';

// Niskala® — vanilla JavaScript. No build step, trackers, or external JS libraries.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.documentElement.classList.add('js-ready');

// Scroll progress + sticky header.
const progress = $('#progress');
const header = $('#siteHeader');
let scrollScheduled = false;
function updateScrollUI() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  header.classList.toggle('is-scrolled', window.scrollY > 20);
  scrollScheduled = false;
}
window.addEventListener('scroll', () => {
  if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateScrollUI); }
}, { passive: true });
window.addEventListener('resize', updateScrollUI);
updateScrollUI();

// Scroll reveal with a sensible reduced-motion fallback.
const reveals = $$('.reveal');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -35px 0px', threshold: .06 });
  reveals.forEach((el) => observer.observe(el));
} else reveals.forEach((el) => el.classList.add('in-view'));

// Pointer detail (desktop only, decorative, never required to navigate).
const cursor = $('#cursorDot');
if (window.matchMedia('(pointer:fine)').matches && !reducedMotion.matches) {
  window.addEventListener('pointermove', (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  }, { passive: true });
  $$('a,button,summary').forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add('grow'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('grow'));
  });
}

// Mobile navigation.
const menuToggle = $('#menuToggle');
const mobileMenu = $('#mobileMenu');
function closeMobileMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Buka menu');
  mobileMenu.classList.remove('open');
  mobileMenu.inert = true;
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  mobileMenu.classList.toggle('open', open);
  mobileMenu.inert = !open;
});
$$('#mobileMenu a, #mobileMenu button').forEach(el => el.addEventListener('click', closeMobileMenu));
window.addEventListener('resize', () => { if (window.innerWidth > 850) closeMobileMenu(); });
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMobileMenu(); });

// Hero poster: a small playful surprise on click or tap.
const heroArt = $('#heroArt');
const artText = $('#artText');
let artMode = 0;
heroArt.addEventListener('click', () => {
  artMode = (artMode + 1) % 3;
  const texts = [ 'YANG<br>BIASA?<br><em>SKIP.</em>', 'IDE<br>LIAR.<br><em>GAS.</em>', 'NO<br>DRAMA.<br><em>CREATE.</em>' ];
  artText.innerHTML = texts[artMode];
  heroArt.classList.toggle('mode-alt', artMode % 2 !== 0);
});
if (window.matchMedia('(pointer:fine)').matches && !reducedMotion.matches) {
  heroArt.addEventListener('pointermove', (event) => {
    const box = heroArt.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - .5;
    const y = (event.clientY - box.top) / box.height - .5;
    heroArt.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) rotate(3deg)`;
  }, { passive: true });
  heroArt.addEventListener('pointerleave', () => { heroArt.style.transform = ''; });
}

// Work filters.
const filterButtons = $$('.filter');
const projects = $$('.project-card');
filterButtons.forEach((button) => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  filterButtons.forEach(b => {
    const active = b === button;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  projects.forEach((card) => card.classList.toggle('hidden', category !== 'all' && card.dataset.category !== category));
}));

// Modal handling.
const briefDialog = $('#briefDialog');
const projectDialog = $('#projectDialog');
const firstField = $('#briefName');
function openDialog(dialog) {
  if (dialog === briefDialog && projectDialog.open) projectDialog.close();
  if (dialog === projectDialog && briefDialog.open) briefDialog.close();
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('modal-open');
  if (dialog === briefDialog) setTimeout(() => firstField.focus(), 40);
}
[briefDialog, projectDialog].forEach((dialog) => {
  dialog.addEventListener('close', () => {
    if (!briefDialog.open && !projectDialog.open) document.body.classList.remove('modal-open');
  });
  // Clicking the backdrop closes the dialog; clicking contents does not.
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
});
$$('[data-open-brief]').forEach((el) => el.addEventListener('click', () => { closeMobileMenu(); openDialog(briefDialog); }));
$('#closeBrief').addEventListener('click', () => briefDialog.close());
$('#closeProject').addEventListener('click', () => projectDialog.close());

const projectData = {
  sudut: { num: 'CONCEPT 01 / BRAND IDENTITY', title: 'SUDUT.', desc: 'Eksplorasi identitas coffee shop dengan sistem logo tegas, packaging playful, dan warna yang gampang dikenali. Ini bukan project klien.' },
  rasa: { num: 'CONCEPT 02 / UI/UX DESIGN', title: 'RASA.', desc: 'Eksperimen aplikasi kuliner yang mengutamakan navigasi mudah, mood-based browsing, dan desain mobile yang ramah dipakai.' },
  jeda: { num: 'CONCEPT 03 / WEB EXPERIENCE', title: 'JEDA.', desc: 'Eksperimen landing page wellness: tipografi besar, ruang bernapas, dan interaksi yang halus untuk pengalaman yang tenang.' }
};
projects.forEach((card) => card.addEventListener('click', () => {
  const item = projectData[card.dataset.project];
  if (!item) return;
  $('#projectNumber').textContent = item.num;
  $('#projectTitle').textContent = item.title;
  $('#projectDescription').textContent = item.desc;
  openDialog(projectDialog);
}));

// Idea lab: 3 × 3 combinations. Dynamic text, card color, focus, and brief hand-off.
const labCopy = {
  brand: { bold: ['Brand', 'UNCOMMON<br>IS GOOD<span>.</span>', 'Visual yang berani tampil, tipografi tegas, dan warna yang langsung bikin orang nengok.'], calm: ['Brand', 'LESS<br>BUT BETTER<span>.</span>', 'Identitas yang lapang, warna lembut, dan detail kecil yang bikin brand terasa premium.'], fun: ['Brand', 'STAY<br>WEIRD<span>.</span>', 'Karakter playful, bentuk ekspresif, dan identitas yang gampang diajak ngobrol.'] },
  web: { bold: ['Website', 'MAKE<br>IT LOUD<span>.</span>', 'Website editorial dengan headline besar, interaksi berani, dan CTA yang susah dilewatkan.'], calm: ['Website', 'SPACE<br>TO BREATHE<span>.</span>', 'Website clean dengan alur jelas, whitespace lega, dan motion lembut yang terukur.'], fun: ['Website', 'SCROLL<br>& SMILE<span>.</span>', 'Website playful dengan micro-interaction kejutan, storytelling, dan navigasi tetap simpel.'] },
  app: { bold: ['Aplikasi', 'TAP<br>THE FUTURE<span>.</span>', 'UI yang punya karakter kuat, navigasi cepat, dan komponen yang konsisten.'], calm: ['Aplikasi', 'JUST<br>FEELS RIGHT<span>.</span>', 'Pengalaman aplikasi yang intuitif, tenang, minim friksi, dan fokus ke kebutuhan pengguna.'], fun: ['Aplikasi', 'GOOD<br>VIBES ONLY<span>.</span>', 'Aplikasi yang human-friendly dengan feedback interaktif dan tone yang gak mengintimidasi.'] }
};
const labState = { focus: 'brand', mood: 'bold' };
function updateLab() {
  const [label, headline, description] = labCopy[labState.focus][labState.mood];
  $('#labPreview').dataset.mood = labState.mood;
  $('#previewSmall').textContent = `${label.toUpperCase()} CONCEPT / 2026`;
  $('#previewWord').innerHTML = headline;
  $('#previewSticker').innerHTML = ({ bold: 'BOLD<br>IDEAS ✳', calm: 'SLOW<br>MAGIC ☼', fun: 'GOOD<br>VIBES ☺' })[labState.mood];
  $('#labResult').textContent = description;
}
$$('#focusChoices .choice').forEach(button => button.addEventListener('click', () => {
  labState.focus = button.dataset.focus;
  $$('#focusChoices .choice').forEach(el => { const selected = el === button; el.classList.toggle('selected', selected); el.setAttribute('aria-pressed', String(selected)); });
  updateLab();
}));
$$('#moodChoices .choice').forEach(button => button.addEventListener('click', () => {
  labState.mood = button.dataset.mood;
  $$('#moodChoices .choice').forEach(el => { const selected = el === button; el.classList.toggle('selected', selected); el.setAttribute('aria-pressed', String(selected)); });
  updateLab();
}));
$('#useIdea').addEventListener('click', () => {
  const descriptor = ({ bold: 'berani', calm: 'kalem', fun: 'playful' })[labState.mood];
  const [label,, description] = labCopy[labState.focus][labState.mood];
  $('#briefService').value = ({ brand: 'Brand Identity', web: 'Website Experience', app: 'UI/UX Design' })[labState.focus];
  $('#briefIdea').value = `Aku mau bikin ${label.toLowerCase()} dengan vibes ${descriptor}. ${description}`;
  openDialog(briefDialog);
});

// Brief generator. Nothing is sent to a server or an unknown address.
const briefForm = $('#briefForm');
const status = $('#briefStatus');
function buildBrief() {
  const name = $('#briefName').value.trim();
  const service = $('#briefService').value;
  const idea = $('#briefIdea').value.trim();
  const timeline = $('#briefTimeline').value.trim();
  return `HALO NISKALA! ✳\n\nNama: ${name || '(belum diisi)'}\nKebutuhan: ${service}\nCeritanya: ${idea || '(belum diisi)'}\nTimeline / budget: ${timeline || '(mau didiskusikan)'}\n\nBoleh kita ngobrolin project ini?\n\nDibuat lewat Niskala Website Demo`;
}
let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3400);
}
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  // Offline file:// fallback.
  const temporary = document.createElement('textarea');
  temporary.value = text;
  temporary.style.position = 'fixed'; temporary.style.opacity = '0';
  document.body.append(temporary); temporary.select();
  const succeeded = document.execCommand('copy'); temporary.remove();
  if (!succeeded) throw new Error('Browser memblokir clipboard');
  return true;
}
briefForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!briefForm.reportValidity()) return;
  try { await copyText(buildBrief()); status.textContent = 'Brief berhasil disalin. Tempel ke chat atau email Niskala saat kontak resmi tersedia.'; showToast('Brief berhasil disalin! ✳'); }
  catch { status.textContent = 'Clipboard tidak tersedia. Gunakan tombol "Unduh .txt" di sebelahnya.'; }
});
$('#downloadBrief').addEventListener('click', () => {
  const blob = new Blob([buildBrief()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'brief-project-niskala.txt'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  status.textContent = 'Brief berhasil diunduh sebagai file teks.';
  showToast('Brief diunduh!');
});
