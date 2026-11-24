(() => {
if (document.documentElement.dataset.siteOffline === 'true') {
  document.title = 'Website unavailable';
  document.querySelector('meta[name="description"]').content = 'This website is currently unavailable.';
  return;
}

const logoBadge = document.querySelector('.badge');
const logoDialog = document.querySelector('#logo-viewer');
const logoTrigger = document.querySelector('.brand');
logoTrigger.addEventListener('click', () => logoDialog.showModal());
const logoAnimation = logoDialog.querySelector('img');
const contactEmail = 'nuie123@yahoo.com.au';
const logoStatus = document.createElement('p');
logoStatus.className = 'logo-status';
logoStatus.setAttribute('role', 'status');
logoStatus.hidden = true;
logoDialog.append(logoStatus);
const logoEmailLink = logoDialog.querySelector('.logo-email');
logoAnimation.draggable = false;
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
logoEmailLink.addEventListener('click', () => {
  // Copy during the user gesture, before the native mail link opens another app.
  const copiedImmediately = copyContactEmailFallback();
  const copied = copiedImmediately
    ? Promise.resolve(true)
    : navigator.clipboard?.writeText
      ? navigator.clipboard.writeText(contactEmail).then(() => true, () => false)
      : Promise.resolve(false);
  copied.then(success => {
    logoStatus.textContent = success ? 'Email copied: ' + contactEmail : 'Copy email: ' + contactEmail;
    logoStatus.hidden = false;
  });
});
logoDialog.addEventListener('click', event => {
  if (event.target.closest('.logo-email')) return;
  logoDialog.close();
});
logoDialog.addEventListener('close', () => {
  logoStatus.hidden = true;
  logoTrigger.focus({ preventScroll: true });
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
const photos = [['garden-welcome','welcomePhoto'],["children-sunset-beach", "childrenSunsetPhoto"],["coconuts-blue-lagoon", "coconutsPhoto"],["rippling-sea-sunset", "ripplingSunsetPhoto"],['palm-garden','palms'],['garden-2446','beachPhoto'],['garden-0972','sunsetPhoto'],['flower-covered-house','garden'],['tropical-garden-path','pathPhoto'],["lush-tropical-garden", "bougainvilleaPhoto"],["rocky-shore-sunset", "rockySunsetPhoto"],["serene-ocean-sunset", "sereneSunsetPhoto"],["plumeria-sunset", "plumeriaPhoto"],["sailboat-island", "sailboatPhoto"]];
let activePhotos = photos;
let activeCollection = null;
let requestedGalleryIndex = 0;
let galleryRequest = 0;
let galleryLoadingTimer;
const galleryCache = new Map();
const expandedPhoto = dialog.querySelector('img');
const galleryTitle = document.createElement('h2');
galleryTitle.id = 'viewer-title';
galleryTitle.hidden = true;
dialog.prepend(galleryTitle);
const galleryThumbnails = document.createElement('div');
galleryThumbnails.className = 'gallery-thumbnails';
galleryThumbnails.hidden = true;
dialog.append(galleryThumbnails);
function openGallery(items, index, collection = null) {
  ++galleryRequest;
  clearGalleryLoading();
  activePhotos = items;
  activeCollection = collection;
  expandedPhoto.removeAttribute('src');
  expandedPhoto.alt = '';
  dialog.querySelector('p').textContent = '';
  dialog.classList.toggle('house-gallery', Boolean(collection));
  galleryTitle.hidden = !collection;
  galleryTitle.textContent = collection ? locales[document.documentElement.lang][collection] : '';
  dialog.setAttribute('aria-labelledby', collection ? 'viewer-title' : 'gallery-caption');
  galleryThumbnails.hidden = !collection;
  galleryThumbnails.replaceChildren();
  if (collection) {
    items.forEach(([file, key], photoIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', locales[document.documentElement.lang][key] + ' · ' + (photoIndex + 1) + ' / ' + items.length);
      button.setAttribute('aria-pressed', 'false');
      const thumbnail = new Image();
      thumbnail.src = 'img/' + file + '.jpg';
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      button.append(thumbnail);
      button.onclick = () => showGalleryPhoto(photoIndex);
      galleryThumbnails.append(button);
    });
  }
  showGalleryPhoto(index);
  dialog.showModal();
}

const galleryStatus = document.createElement('div');
galleryStatus.className = 'gallery-status';
galleryStatus.hidden = true;
const galleryMessage = document.createElement('span');
galleryMessage.setAttribute('role', 'status');
const galleryRetry = document.createElement('button');
galleryRetry.type = 'button';
galleryRetry.hidden = true;
galleryStatus.append(galleryMessage, galleryRetry);
dialog.append(galleryStatus);
const wrapGalleryIndex = index => (index + activePhotos.length) % activePhotos.length;
function loadGalleryPhoto(index) {
  const file = activePhotos[index][0];
  if (!galleryCache.has(file)) {
    const pending = new Promise((resolve, reject) => {
      const photo = new Image();
      const timeout = setTimeout(() => finish(new Error('Image load timed out')), 20000);
      function finish(error) {
        clearTimeout(timeout);
        photo.onload = photo.onerror = null;
        if (error) reject(error);
        else resolve(photo);
      }
      photo.onload = () => photo.decode().then(() => finish(), finish);
      photo.onerror = () => finish(new Error('Image unavailable'));
      photo.src = 'img/' + file + '.jpg';
    }).catch(error => {
      galleryCache.delete(file);
      throw error;
    });
    galleryCache.set(file, pending);
  }
  return galleryCache.get(file);
}
function clearGalleryLoading() {
  clearTimeout(galleryLoadingTimer);
  dialog.classList.remove('is-loading');
  dialog.setAttribute('aria-busy', 'false');
  galleryStatus.hidden = true;
  galleryRetry.hidden = true;
}
async function showGalleryPhoto(index) {
  requestedGalleryIndex = wrapGalleryIndex(index);
  const target = requestedGalleryIndex;
  const request = ++galleryRequest;
  clearGalleryLoading();
  dialog.setAttribute('aria-busy', 'true');
  galleryLoadingTimer = setTimeout(() => {
    dialog.classList.add('is-loading');
    galleryMessage.textContent = locales[document.documentElement.lang].photoLoading;
    galleryStatus.hidden = false;
  }, 200);
  try {
    const photo = await loadGalleryPhoto(target);
    if (request !== galleryRequest) return;
    const caption = locales[document.documentElement.lang][activePhotos[target][1]];
    expandedPhoto.src = photo.src;
    expandedPhoto.alt = caption;
    dialog.querySelector('p').textContent = caption + ' · ' + (target + 1) + ' / ' + activePhotos.length;
    [...galleryThumbnails.children].forEach((button, index) => button.setAttribute('aria-pressed', String(index === target)));
    clearGalleryLoading();
    for (const neighbor of [target - 1, target + 1]) {
      loadGalleryPhoto(wrapGalleryIndex(neighbor)).catch(() => {});
    }
  } catch {
    if (request !== galleryRequest) return;
    clearGalleryLoading();
    const copy = locales[document.documentElement.lang];
    galleryMessage.textContent = copy.photoLoadError;
    galleryRetry.textContent = copy.retryPhoto;
    galleryRetry.hidden = false;
    galleryStatus.hidden = false;
  }
}
galleryRetry.onclick = () => showGalleryPhoto(requestedGalleryIndex);
function stepGallery(direction) {
  showGalleryPhoto(requestedGalleryIndex + (document.documentElement.dir === 'rtl' ? -direction : direction));
}
for (const [index, [file,key]] of photos.slice(0, 4).entries()) {
  const button = document.createElement('button');
  const photo = new Image();
  photo.src = 'img/' + file + '.jpg';
  photo.loading = 'lazy';
  photo.dataset.alt = key;
  button.append(photo);
  button.onclick = () => {
    openGallery(photos, index);
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
dialog.addEventListener('close', () => {
  swipeStart = null;
  ++galleryRequest;
  clearGalleryLoading();
});
dialog.onclick = event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
};
// Photos for each accommodation collection, in display order.
const stayCollections = {
  oneBedroom: ['private-house-garden-entrance', 'private-house-porch', 'private-house-living-kitchen', 'private-house-interior', 'private-house-living-space', 'private-house-bedroom'],
  twinHouse: ['twin-house-patio', 'twin-house-kitchen', 'twin-house-living-wood', 'twin-house-bedroom', 'twin-house-living-kitchen', 'twin-house-living-bright'],
  twoBedroom: ['two-bedroom-exterior', 'two-bedroom-balcony-bedroom', 'two-bedroom-living-kitchen', 'two-bedroom-rattan-bedroom', 'two-bedroom-lounge', 'two-bedroom-bathroom'],
  studios: ['studio-sea-balcony', 'studio-kitchen-space', 'studio-balcony-living', 'studio-bathroom-corner', 'studio-swan-bedroom', 'studio-oceanview-bedroom']
};
for (const button of document.querySelectorAll('[data-collection]')) {
  button.onclick = () => {
    const key = button.dataset.collection;
    openGallery(stayCollections[key].map(file => [file, key]), 0, key);
  };
}
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
  if (dialog.open) showGalleryPhoto(requestedGalleryIndex);
  if (activeCollection) {
    galleryTitle.textContent = copy[activeCollection];
    [...galleryThumbnails.children].forEach((button, index) => {
      button.setAttribute('aria-label', copy[activePhotos[index][1]] + ' · ' + (index + 1) + ' / ' + activePhotos.length);
    });
  }
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
