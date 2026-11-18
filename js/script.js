(() => {
if (document.documentElement.dataset.siteOffline === 'true') {
  document.title = 'Website unavailable';
  document.querySelector('meta[name="description"]').content = 'This website is currently unavailable.';
  return;
}

const nav = document.querySelector('nav');
const menu = document.querySelector('#menu');
const language = document.querySelector('#language');
const theme = document.querySelector('#theme');
const dialog = document.querySelector('dialog');
for (const id of ['home','info','gallery','houses','studio','reviews','map','contacts']) {
  const link = document.createElement('a');
  link.href = '#' + id;
  link.dataset.i18n = id;
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
function setLang(value) {
  const copy = locales[value] || locales.en;
  document.documentElement.lang = value;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = copy[el.dataset.i18n]; });
  document.querySelectorAll('[data-alt]').forEach(el => { el.alt = copy[el.dataset.alt]; });
  for (const [el,key] of [[language,'language'],[menu,'menu'],[theme,'theme'],[dialog.querySelector('button'),'close']]) el.setAttribute('aria-label',copy[key]);
  language.value = value;
  document.querySelector('#language-code').textContent = value.toUpperCase();
  localStorage.setItem('samui-language',value);
}
function applyTheme(value) {
  document.documentElement.dataset.theme = value;
  theme.querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', button.dataset.mode === value);
  });
  localStorage.setItem('theme',value);
}
theme.querySelectorAll('button').forEach(button => {
  button.onclick = () => applyTheme(button.dataset.mode);
});
const languagePill = language.closest('.language-pill');
document.addEventListener('keydown', event => {
  if (event.key === 'Tab') languagePill.classList.add('keyboard-navigation');
});
document.addEventListener('pointerdown', () => languagePill.classList.remove('keyboard-navigation'));
let languageChange = 0;
let fallbackFade;
language.onchange = async () => {
  const value = language.value;
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
