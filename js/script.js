(() => {
if (document.documentElement.dataset.siteOffline === 'true') {
  document.title = 'Website unavailable';
  document.querySelector('meta[name="description"]').content = 'This website is currently unavailable.';
  return;
}

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
const dialog = document.querySelector('dialog');
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
const photos = [['sea-terrace','terrace'],['garden-house','garden'],['house-bedroom','bedroom'],['palm-garden','palms'],['house-living','living'],['garden-bedroom','bedroom'],['studio-bedroom','bedroom'],['studio-living','studio']];
for (const [file,key] of photos) {
  const button = document.createElement('button');
  const photo = new Image();
  photo.src = 'img/' + file + '.jpg';
  photo.loading = 'lazy';
  photo.dataset.alt = key;
  button.append(photo);
  button.onclick = () => {
    const expanded = dialog.querySelector('img');
    expanded.src = photo.src;
    expanded.alt = photo.alt;
    dialog.querySelector('p').textContent = photo.alt;
    dialog.showModal();
  };
  document.querySelector('.photos').append(button);
}
dialog.querySelector('button').onclick = () => dialog.close();
dialog.onclick = event => { if (event.target === dialog) dialog.close(); };
// Replace these placeholder paths individually when the final five photos are ready.
const stayCollections = {
  oneBedroom: ['garden-house', 'garden-house', 'garden-house', 'garden-house', 'garden-house'],
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
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = copy[el.dataset.i18n]; });
  document.querySelectorAll('[data-alt]').forEach(el => { el.alt = copy[el.dataset.alt]; });
  for (const [el,key] of [[language,'language'],[menu,'menu'],[theme,'theme'],[dialog.querySelector('button'),'close']]) el.setAttribute('aria-label',copy[key]);
  language.value = value;
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-checked', button.dataset.language === value));
  document.querySelector('#language-flag').src = 'img/flags/' + (value === 'en' ? 'gb' : value) + '.svg';
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
// Keep a tap from blurring the picker before click can toggle its current state.
language.addEventListener('pointerdown', event => event.preventDefault());
language.onclick = event => languageOptions.hidden ? openLanguagePicker(event.detail === 0) : closeLanguagePicker(event.detail === 0);
language.addEventListener('keydown', event => {
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
