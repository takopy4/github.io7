(() => {
  const photos = [
    { src: 'images/tokyo-neon-traveler.webp', title: 'Огни Токио', place: 'Вечерний город', alt: 'Путешественник на фоне ярких огней токийской улицы' },
    { src: 'images/tokyo-alley-ride.webp', title: 'Тихий переулок', place: 'Токио, Япония', alt: 'Узкая городская улица Токио в мягком вечернем свете' },
    { src: 'images/tokyo-shop-street.webp', title: 'Улица старого города', place: 'Японский квартал', alt: 'Улица японского города с небольшими магазинами и вывесками' },
    { src: 'images/shibuya-sunset.webp', title: 'Закат над городом', place: 'Сибуя, Токио', alt: 'Панорама района Сибуя на закате' },
    { src: 'images/tokyo-golden-hour.webp', title: 'Золотой час', place: 'Токио, Япония', alt: 'Японская городская улица в тёплом вечернем свете' },
    { src: 'images/kyoto-matcha.jpg', title: 'Матча-пауза', place: 'Киото, Япония', alt: 'Витрина магазина матча в Киото' },
    { src: 'images/kyoto-cafe.jpg', title: 'Кофе по пути', place: 'Японская кофейня', alt: 'Небольшая кофейня на тихой улице' },
    { src: 'images/venice-beach-blue-hour.webp', title: 'Синий час', place: 'Побережье', alt: 'Пирс и океан в сумерках' }
  ];

  const track = document.querySelector('#gallery-track');
  const prev = document.querySelector('.arrow--prev');
  const next = document.querySelector('.arrow--next');
  const pagination = document.querySelector('#pagination');
  const currentLabel = document.querySelector('#current-page');
  const totalLabel = document.querySelector('#total-pages');
  let position = 0;
  let perPage = 3;
  let pointerDown = false;
  let dragging = false;
  let pointerStartX = 0;

  photos.forEach((photo, index) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `<img src="${photo.src}" alt="${photo.alt}" draggable="false" ${index > 2 ? 'loading="lazy"' : 'fetchpriority="high"'}><div class="card-caption"><strong>${photo.title}</strong></div>`;
    track.append(card);
  });

  function visibleCount() {
    if (window.matchMedia('(max-width: 520px)').matches) return 1;
    if (window.matchMedia('(max-width: 760px)').matches) return 2;
    return 3;
  }
  function maxPosition() { return Math.max(0, photos.length - perPage); }
  function getDots() { return [...pagination.querySelectorAll('.dot')]; }

  function buildDots(count) {
    pagination.innerHTML = '<span class="page-indicator" aria-hidden="true"></span>';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.type = 'button';
      dot.dataset.position = String(i);
      dot.setAttribute('aria-label', `Показать изображения с ${i + 1}-го`);
      dot.addEventListener('click', () => {
        if (dragging) return;
        position = i;
        render();
      });
      pagination.append(dot);
    }
  }

  function render() {
    perPage = visibleCount();
    position = Math.max(0, Math.min(position, maxPosition()));
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const cardWidth = track.querySelector('.card').getBoundingClientRect().width;
    track.style.transform = `translate3d(-${position * (cardWidth + gap)}px, 0, 0)`;

    const positions = maxPosition() + 1;
    if (getDots().length !== positions) buildDots(positions);
    const dots = getDots();
    const nearest = Math.round(position);
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === nearest)));

    const indicator = pagination.querySelector('.page-indicator');
    const first = dots[0];
    const step = dots.length > 1 ? dots[1].offsetLeft - first.offsetLeft : 0;
    const x = first.offsetLeft + first.offsetWidth / 2 - indicator.offsetWidth / 2 + position * step;
    indicator.style.transform = `translate3d(${x}px, -50%, 0)`;

    currentLabel.textContent = String(nearest + 1).padStart(2, '0');
    totalLabel.textContent = String(positions).padStart(2, '0');
    prev.disabled = position <= 0;
    next.disabled = position >= maxPosition();
  }

  function positionFromPointer(clientX) {
    const dots = getDots();
    if (dots.length < 2) return 0;
    const firstRect = dots[0].getBoundingClientRect();
    const lastRect = dots[dots.length - 1].getBoundingClientRect();
    const firstCenter = firstRect.left + firstRect.width / 2;
    const lastCenter = lastRect.left + lastRect.width / 2;
    const ratio = Math.max(0, Math.min(1, (clientX - firstCenter) / (lastCenter - firstCenter)));
    return ratio * maxPosition();
  }

  prev.addEventListener('click', () => { if (position > 0) { position = Math.max(0, position - 1); render(); } });
  next.addEventListener('click', () => { if (position < maxPosition()) { position = Math.min(maxPosition(), position + 1); render(); } });

  // Dragging the pager scrubs the carousel continuously; release settles on the nearest image.
  pagination.addEventListener('pointerdown', event => {
    if (event.button !== undefined && event.button !== 0) return;
    pointerDown = true;
    dragging = false;
    pointerStartX = event.clientX;
  });
  window.addEventListener('pointermove', event => {
    if (!pointerDown) return;
    if (Math.abs(event.clientX - pointerStartX) > 2) {
      dragging = true;
      pagination.classList.add('is-dragging');
      track.classList.add('is-dragging');
      position = positionFromPointer(event.clientX);
      render();
    }
  });
  window.addEventListener('pointerup', () => {
    if (!pointerDown) return;
    pointerDown = false;
    if (dragging) {
      position = Math.round(position);
      pagination.classList.remove('is-dragging');
      track.classList.remove('is-dragging');
      render();
      // Suppress the synthetic click generated at the end of a drag.
      window.setTimeout(() => { dragging = false; }, 80);
    } else {
      dragging = false;
    }
  });

  track.addEventListener('touchstart', event => { pointerStartX = event.changedTouches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', event => {
    const delta = event.changedTouches[0].clientX - pointerStartX;
    if (Math.abs(delta) > 45) {
      if (delta < 0 && position < maxPosition()) position = Math.min(maxPosition(), Math.round(position) + 1);
      else if (delta > 0 && position > 0) position = Math.max(0, Math.round(position) - 1);
      render();
    }
  }, { passive: true });
  window.addEventListener('resize', render);
  render();
})();
