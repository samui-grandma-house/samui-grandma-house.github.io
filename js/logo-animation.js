(() => {
  if (document.documentElement.dataset.siteOffline === 'true') return;
  const dialog = document.querySelector('#logo-viewer');
  const image = dialog.querySelector('img');
  const canvas = document.createElement('canvas');
  canvas.className = 'logo-scene';
  canvas.width = 758;
  canvas.height = 502;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Samui Grandma House: the Southern Cross, with four bright stars lighting four windows from top left to bottom right and a fifth, dimmer star.');
  const ctx = canvas.getContext('2d');
  const base = document.createElement('canvas');
  base.width = 379;
  base.height = 251;
  const baseContext = base.getContext('2d');
  if (!ctx || !baseContext) return;
  // Vector lettering stays sharp at every display size and pixel density.
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const lettering = document.createElementNS(svgNamespace, 'svg');
  lettering.classList.add('logo-lettering');
  lettering.setAttribute('viewBox', '0 0 379 82');
  lettering.setAttribute('aria-hidden', 'true');
  for (const [text, y, size, weight, spacing] of [
    ['SAMUI GRANDMA HOUSE', 25, 20, 800, 0],
    ['THAILAND', 48, 16, 700, 5],
    ['MAIL: NUIE123@YAHOO.COM.AU', 68, 12.5, 700, 1]
  ]) {
    const line = document.createElementNS(svgNamespace, 'text');
    line.textContent = text;
    for (const [key, value] of Object.entries({
      x: 189.5, y, 'text-anchor': 'middle', 'font-size': size,
      'font-weight': weight, 'font-family': 'Arial, Helvetica, sans-serif',
      'letter-spacing': spacing, fill: '#000'
    })) line.setAttribute(key, value);
    lettering.append(line);
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // Each pair shares one opacity, so its star and pane always change together.
  const pairs = [
    // Stylized Crux: top, left arm, right arm, and the longer lower tip.
    { star: [62, 32], pane: [198, 135] },
    { star: [36, 59], pane: [215, 135] },
    { star: [85, 55], pane: [198, 152] },
    { star: [66, 102], pane: [215, 152] }
  ];
  const ease = value => {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
  };
  let ready = false;
  let frame = 0;
  let startedAt = 0;
  function draw(time) {
    const night = ease((time - 1.5) / 2) * (1 - ease((time - 9.8) / 1.8));
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 379, 251);
    const sky = ctx.createLinearGradient(0, 0, 0, 169);
    sky.addColorStop(0, `rgb(${Math.round(255 - 248 * night)} ${Math.round(255 - 215 * night)} ${Math.round(255 - 139 * night)})`);
    sky.addColorStop(1, `rgb(${Math.round(255 - 107 * night)} ${Math.round(255 - 62 * night)} 255)`);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 379, 169);
    // Ease the sky into the white text panel before drawing the sharp logo.
    const skyToPaper = ctx.createLinearGradient(0, 112, 0, 169);
    for (let step = 0; step <= 12; step++) {
      const position = step / 12;
      skyToPaper.addColorStop(position, `rgba(255, 255, 255, ${ease(position)})`);
    }
    ctx.fillStyle = skyToPaper;
    ctx.fillRect(0, 112, 379, 57);
    // Preserve the original logo; the lower text is rendered separately as vectors.
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(base, 0, 0, 379, 169, 0, 0, 379, 169);
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.shadowColor = '#ffe877';
    ctx.shadowBlur = 14 * night;
    ctx.fillStyle = '#ffe877';
    ctx.beginPath();
    ctx.arc(315, 47, 17 + 6 * night, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1 - night;
    ctx.strokeStyle = '#ffc900';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(315 + Math.cos(angle) * 25, 47 + Math.sin(angle) * 25);
      ctx.lineTo(315 + Math.cos(angle) * 31, 47 + Math.sin(angle) * 31);
      ctx.stroke();
    }
    // The blue line belongs to daylight and fades with the sun's rays.
    ctx.globalAlpha = 1 - night;
    ctx.strokeStyle = '#30d4ef';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(253, 87);
    ctx.bezierCurveTo(286, 65, 309, 108, 350, 82);
    ctx.stroke();
    pairs.forEach(({ star: [x, y], pane: [px, py] }, index) => {
      const opacity = ease((time - 4 - index * 0.45) / 0.3)
        * (1 - ease((time - 8 - index * 0.45) / 0.3));
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(x, y - 7);
      ctx.quadraticCurveTo(x + 1, y - 1, x + 6, y);
      ctx.quadraticCurveTo(x + 1, y + 1, x, y + 7);
      ctx.quadraticCurveTo(x - 1, y + 1, x - 6, y);
      ctx.quadraticCurveTo(x - 1, y - 1, x, y - 7);
      ctx.fill();
      ctx.fillStyle = '#ffdf3c';
      ctx.beginPath();
      ctx.roundRect(px, py, 12, 12, 1.5);
      ctx.fill();
    });
    // The smaller fifth star sits inside the lower-right side of the kite.
    // It follows the constellation's fade without controlling an extra pane.
    ctx.globalAlpha = 0.45 * ease((time - 5.35) / 0.3)
      * (1 - ease((time - 8) / 0.3));
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(76, 76, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  function tick(now) {
    draw(((now - startedAt) / 1000) % 12);
    frame = requestAnimationFrame(tick);
  }
  function updatePlayback() {
    cancelAnimationFrame(frame);
    if (!ready || !dialog.open || document.hidden) return;
    startedAt = performance.now();
    draw(0);
    if (!reducedMotion.matches) frame = requestAnimationFrame(tick);
  }
  function initialize() {
    if (ready || !image.naturalWidth) return;
    baseContext.drawImage(image, 0, 0, 379, 251);
    image.after(canvas, lettering);
    image.hidden = true;
    ready = true;
    draw(0);
    updatePlayback();
  }
  if (image.complete) initialize();
  else image.addEventListener('load', initialize, { once: true });
  new MutationObserver(updatePlayback).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  document.addEventListener('visibilitychange', updatePlayback);
  reducedMotion.addEventListener('change', updatePlayback);
})();
