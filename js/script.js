(() => {
if (document.documentElement.dataset.siteOffline === 'true') {
  document.title = 'Website unavailable';
  document.querySelector('meta[name="description"]').content = 'This website is currently unavailable.';
  return;
}

const logoBadge = document.querySelector('.badge');
const logoDialog = document.querySelector('#logo-viewer');
logoBadge.addEventListener('click', () => logoDialog.showModal());
const logoAnimation = logoDialog.querySelector('img');
const contactEmail = 'nuie123@yahoo.com.au';
const logoStatus = document.createElement('p');
logoStatus.className = 'logo-status';
logoStatus.setAttribute('role', 'status');
logoStatus.hidden = true;
logoDialog.append(logoStatus);
let logoPress = null;
let logoLongPress = false;
logoAnimation.draggable = false;
logoAnimation.addEventListener('contextmenu', event => event.preventDefault());
logoAnimation.addEventListener('pointerdown', event => {
  logoLongPress = false;
  if (!event.isPrimary || event.button !== 0) { logoPress = null; return; }
  logoPress = { id: event.pointerId, x: event.clientX, y: event.clientY, start: performance.now() };
  logoAnimation.setPointerCapture(event.pointerId);
});
logoAnimation.addEventListener('pointermove', event => {
  if (logoPress && Math.hypot(event.clientX - logoPress.x, event.clientY - logoPress.y) > 12) logoPress = null;
});
logoAnimation.addEventListener('pointerup', event => {
  logoLongPress = logoPress?.id === event.pointerId && performance.now() - logoPress.start >= 600;
  logoPress = null;
});
logoAnimation.addEventListener('pointercancel', () => { logoPress = null; logoLongPress = false; });
function copyContactEmailFallback() {
  const field = document.createElement('textarea');
  field.value = contactEmail;
  field.className = 'clipboard-field';
  field.readOnly = true;
  logoDialog.append(field);
  field.select();
  field.setSelectionRange(0, contactEmail.length);
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { /* Show the address if copying is blocked. */ }
  field.remove();
  return copied;
}
logoDialog.addEventListener('click', event => {
  if (event.target !== logoAnimation || !logoLongPress) {
    logoDialog.close();
    return;
  }
  logoLongPress = false;
  // Use the release click so clipboard and mail actions retain user activation.
  const copied = navigator.clipboard?.writeText
    ? navigator.clipboard.writeText(contactEmail).then(() => true, copyContactEmailFallback)
    : Promise.resolve(copyContactEmailFallback());
  copied.then(success => {
    logoStatus.textContent = success ? 'Email copied: ' + contactEmail : 'Copy email: ' + contactEmail;
    logoStatus.hidden = false;
  });
  window.location.href = 'mailto:' + contactEmail;
});
logoDialog.addEventListener('close', () => {
  logoPress = null;
  logoLongPress = false;
  logoStatus.hidden = true;
  logoBadge.focus({ preventScroll: true });
});
const logoImage = new Image();
logoImage.onload = async () => {
  try { await logoImage.decode(); } catch { /* Loaded images can still render without decode(). */ }
  logoBadge.classList.remove('is-loading');
};
logoImage.onerror = () => {
  logoBadge.classList.remove('is-loading');
  logoBadge.classList.add('load-failed');
};
logoImage.src = 'img/grandma-mark.jpg';

const mapFrame = document.querySelector('.map-frame');
const mapEmbed = mapFrame.querySelector('iframe');
mapFrame.classList.add('is-loading');
mapFrame.setAttribute('aria-busy', 'true');
mapEmbed.addEventListener('load', () => {
  mapFrame.classList.remove('is-loading');
  mapFrame.setAttribute('aria-busy', 'false');
}, { once: true });
// Attach the load handler before starting the lazy request, including cached loads.
mapEmbed.src = mapEmbed.dataset.src;

const nav = document.querySelector('nav');
const menu = document.querySelector('#menu');
const language = document.querySelector('#language');
const theme = document.querySelector('#theme');
const dialog = document.querySelector('#gallery-viewer');
for (const id of ['home','info','gallery','houses','studio','reviews','map','contacts']) {
  const link = document.createElement('a');
  link.href = '#' + id;
  link.dataset.i18n = id === 'studio' ? 'studios' : id;
  nav.append(link);
}
function toggleMenu(open) {
  nav.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', open);
}
menu.onclick = () => toggleMenu(!nav.classList.contains('open'));
nav.onclick = () => toggleMenu(false);
document.addEventListener('keydown', event => { if (event.key === 'Escape') toggleMenu(false); });
const photos = [['palm-garden','palms'],['garden-bedroom','bedroom'],['garden-2446','beachPhoto'],['garden-0972','sunsetPhoto'],['flower-covered-house','garden'],['garden-welcome','welcomePhoto'],['tropical-garden-path','pathPhoto'],['house-in-garden','garden']];
let galleryIndex = 0;
const expandedPhoto = dialog.querySelector('img');
function showGalleryPhoto(index) {
  galleryIndex = (index + photos.length) % photos.length;
  const [file, key] = photos[galleryIndex];
  const caption = locales[document.documentElement.lang][key];
  expandedPhoto.src = 'img/' + file + '.jpg';
  expandedPhoto.alt = caption;
  dialog.querySelector('p').textContent = caption + ' · ' + (galleryIndex + 1) + ' / ' + photos.length;
}
function stepGallery(direction) {
  showGalleryPhoto(galleryIndex + (document.documentElement.dir === 'rtl' ? -direction : direction));
}
for (const [index, [file,key]] of photos.slice(0, 4).entries()) {
  const button = document.createElement('button');
  const photo = new Image();
  photo.src = 'img/' + file + '.jpg';
  photo.loading = 'lazy';
  photo.dataset.alt = key;
  button.append(photo);
  button.onclick = () => {
    showGalleryPhoto(index);
    dialog.showModal();
  };
  document.querySelector('.photos').append(button);
}
dialog.querySelector('.dismiss').addEventListener('click', event => {
  event.stopPropagation();
  dialog.close();
});
dialog.querySelector('.gallery-left').onclick = () => stepGallery(-1);
dialog.querySelector('.gallery-right').onclick = () => stepGallery(1);
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    stepGallery(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
let swipeStart = null;
expandedPhoto.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  expandedPhoto.setPointerCapture(event.pointerId);
});
expandedPhoto.addEventListener('pointerup', event => {
  if (!swipeStart || swipeStart.id !== event.pointerId) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.5) stepGallery(dx < 0 ? 1 : -1);
});
expandedPhoto.addEventListener('pointercancel', () => { swipeStart = null; });
dialog.addEventListener('close', () => { swipeStart = null; });
dialog.onclick = event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
};
// Replace these placeholder paths individually when the final five photos are ready.
const stayCollections = {
  oneBedroom: ['garden-house', 'garden-house', 'garden-house', 'garden-house', 'garden-house'],
  twinHouse: ['garden-house', 'garden-house', 'garden-house', 'garden-house', 'garden-house'],
  twoBedroom: ['house-living', 'house-living', 'house-living', 'house-living', 'house-living'],
  studios: ['studio-living', 'studio-living', 'studio-living', 'studio-living', 'studio-living']
};
const collectionDialog = document.querySelector('#stay-collection');
const collectionPhotos = collectionDialog.querySelector('.collection-photos');
for (const button of document.querySelectorAll('[data-collection]')) {
  button.onclick = () => {
    const key = button.dataset.collection;
    const title = locales[document.documentElement.lang][key];
    collectionDialog.querySelector('h2').textContent = title;
    collectionPhotos.replaceChildren(...stayCollections[key].map((file, index) => {
      const figure = document.createElement('figure');
      const photo = new Image();
      photo.src = 'img/' + file + '.jpg';
      photo.alt = title + ' — ' + (index + 1) + ' / 5';
      photo.loading = index ? 'lazy' : 'eager';
      const caption = document.createElement('figcaption');
      caption.textContent = (index + 1) + ' / 5';
      figure.append(photo, caption);
      return figure;
    }));
    collectionDialog.showModal();
    collectionDialog.scrollTop = 0;
  };
}
collectionDialog.querySelector('button').onclick = () => collectionDialog.close();
collectionDialog.addEventListener('click', event => {
  const bounds = collectionDialog.getBoundingClientRect();
  if (event.target === collectionDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) collectionDialog.close();
});
function setLang(value) {
  const copy = locales[value] || locales.en;
  document.documentElement.lang = value;
  document.documentElement.dir = value === 'he' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = copy[el.dataset.i18n]; });
  document.querySelectorAll('[data-alt]').forEach(el => { el.alt = copy[el.dataset.alt]; });
  for (const [el,key] of [[language,'language'],[menu,'menu'],[theme,'theme'],[dialog.querySelector('button'),'close']]) el.setAttribute('aria-label',copy[key]);
  const rtl = value === 'he';
  dialog.querySelector('.gallery-left').setAttribute('aria-label', copy[rtl ? 'nextPhoto' : 'previousPhoto']);
  dialog.querySelector('.gallery-right').setAttribute('aria-label', copy[rtl ? 'previousPhoto' : 'nextPhoto']);
  if (dialog.open) showGalleryPhoto(galleryIndex);
  collectionDialog.querySelector('.collection-close').setAttribute('aria-label', copy.close);
  logoDialog.querySelector('.logo-close').setAttribute('aria-label', copy.close);
  language.value = value;
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-checked', button.dataset.language === value));
  document.querySelector('#language-flag').src = 'img/flags/' + ({ en: 'gb', he: 'il' }[value] || value) + '.svg';
  localStorage.setItem('samui-language',value);
}
function applyTheme(value) {
  document.documentElement.dataset.theme = value;
  document.querySelector('#theme-icon').textContent = value === 'dark' ? '🌙' : '☀️';
  theme.setAttribute('aria-pressed', value === 'dark');
  localStorage.setItem('theme',value);
}
theme.onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
const languagePill = language.closest('.language-pill');
const languageOptions = document.querySelector('#language-options');
const languageButtons = [...languageOptions.querySelectorAll('button')];
function closeLanguagePicker(restoreFocus = false) {
  languageOptions.hidden = true;
  language.setAttribute('aria-expanded', 'false');
  if (restoreFocus) language.focus();
}
function openLanguagePicker(focusOption = true) {
  languageOptions.hidden = false;
  language.setAttribute('aria-expanded', 'true');
  if (focusOption) languageButtons.find(button => button.dataset.language === language.value).focus();
}
let languageHiddenAtPointerDown = null;
language.addEventListener('pointerdown', event => {
  // Remember the state before mobile focus events can close the menu.
  languageHiddenAtPointerDown = languageOptions.hidden;
  event.preventDefault();
});
language.addEventListener('pointercancel', () => { languageHiddenAtPointerDown = null; });
language.onclick = event => {
  const keyboardActivation = languageHiddenAtPointerDown === null && event.detail === 0;
  const shouldOpen = languageHiddenAtPointerDown ?? languageOptions.hidden;
  languageHiddenAtPointerDown = null;
  if (shouldOpen) openLanguagePicker(keyboardActivation);
  else closeLanguagePicker(keyboardActivation);
};
language.addEventListener('keydown', event => {
  languageHiddenAtPointerDown = null;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    openLanguagePicker();
  }
});
languageButtons.forEach(button => {
  // Keep focus inside the picker until click, including browsers that do not focus buttons on tap.
  button.addEventListener('pointerdown', event => event.preventDefault());
  button.onclick = event => {
    const value = button.dataset.language;
    closeLanguagePicker(event.detail === 0);
    changeLanguage(value);
  };
});
languageOptions.addEventListener('keydown', event => {
  const index = languageButtons.indexOf(document.activeElement);
  let next;
  if (event.key === 'ArrowDown') next = (index + 1) % languageButtons.length;
  if (event.key === 'ArrowUp') next = (index - 1 + languageButtons.length) % languageButtons.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = languageButtons.length - 1;
  if (next !== undefined) { event.preventDefault(); languageButtons[next].focus(); }
});
languagePill.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closeLanguagePicker(true); }
});
languagePill.addEventListener('focusout', event => {
  if (!languagePill.contains(event.relatedTarget)) closeLanguagePicker();
});
document.addEventListener('pointerdown', event => {
  if (!languagePill.contains(event.target)) closeLanguagePicker();
});
let languageChange = 0;
let fallbackFade;
async function changeLanguage(value) {
  const change = ++languageChange;
  fallbackFade?.cancel();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setLang(value);
    return;
  }
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      if (change === languageChange) setLang(value);
    });
    return;
  }
  fallbackFade = document.body.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: 120, easing: 'ease-out', fill: 'forwards'
  });
  try {
    await fallbackFade.finished;
  } catch {
    return; // A newer selection interrupted the fade.
  }
  if (change !== languageChange) return;
  setLang(value);
  fallbackFade.cancel();
  fallbackFade = document.body.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 200, easing: 'ease-out'
  });
};
applyTheme(localStorage.getItem('theme') || 'light');
const saved = localStorage.getItem('samui-language');
setLang(Object.hasOwn(locales,saved) ? saved : 'en');

})();
