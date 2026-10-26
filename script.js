(() => {
  const photos = [
    { src: 'images/tokyo-neon-traveler.webp', title: 'Огни Токио', place: 'Вечерний город', alt: 'Путешественник на фоне ярких огней токийской улицы' },
    { src: 'images/tokyo-alley-ride.webp', title: 'Тихий переулок', place: 'Токио, Япония', alt: 'Узкая городская улица Токио в мягком вечернем свете' },
    { src: 'images/tokyo-shop-street.webp', title: 'Улица старого города', place: 'Японский квартал', alt: 'Улица японского города с небольшими магазинами и вывесками' },
    { src: 'images/shibuya-sunset.webp', title: 'Закат над городом', place: 'Сибуя, Токио', alt: 'Панорама района Сибуя на закате' },
    { src: 'images/tokyo-golden-hour.webp', title: 'Золотой час', place: 'Токио, Япония', alt: 'Японская городская улица в тёплом вечернем свете' },
    { src: 'images/kyoto-matcha.jpg', title: 'Матча-пауза', place: 'Киото, Япония', alt: 'Витрина магазина матча в Киото' },
    { src: 'images/kyoto-cafe.jpg', title: 'Кофе по пути', place: 'Японская кофейня', alt: 'Небольшая кофейня на тихой улице' },
    { src: 'images/venice-beach-blue-hour.webp', title: 'Синий час', place: 'Венеция, Калифорния', alt: 'Пирс и океан в сумерках' }
  ];

  const track = document.querySelector('#gallery-track');
  const prev = document.querySelector('.arrow--prev');
  const next = document.querySelector('.arrow--next');
  const pagination = document.querySelector('#pagination');
  const currentLabel = document.querySelector('#current-page');
  const endLabel = document.querySelector('#end-page');
  const totalLabel = document.querySelector('#total-pages');
  const counterDash = document.querySelector('.counter-dash');
  const status = document.querySelector('#gallery-status');
  const gallery = document.querySelector('.gallery');
  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = document.querySelector('#lightbox-image');
  const lightboxCaption = document.querySelector('#lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');

  let position = 0;
  let perPage = 3;
  let pointerDown = false;
  let dragging = false;
  let pointerStartX = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let swipeMoved = false;
  let lightboxIndex = 0;

  photos.forEach((photo, index) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.index = String(index);

    const eager = index <= 2;
    const loading = eager ? '' : 'loading="lazy"';
    const priority = index === 0 ? 'fetchpriority="high"' : '';

    card.innerHTML = `
      <img src="${photo.src}" alt="${photo.alt}" width="1000" height="1250" draggable="false" decoding="async" ${loading} ${priority}>
      <div class="card-caption">
        <strong>${photo.title}</strong>
        <span>${photo.place}</span>
      </div>
      <button class="card-open" type="button" aria-label="Открыть фотографию: ${photo.title}"></button>`;

    card.querySelector('img').addEventListener('error', (event) => {
      card.classList.add('is-missing');
      event.currentTarget.remove();
    });

    card.querySelector('.card-open').addEventListener('click', () => {
      if (swipeMoved) {
        swipeMoved = false;
        return;
      }
      openLightbox(index);
    });

    track.append(card);
  });

  function visibleCount() {
    if (window.matchMedia('(max-width: 520px)').matches) return 1;
    if (window.matchMedia('(max-width: 760px)').matches) return 2;
    return 3;
  }

  function maxPosition() {
    return Math.max(0, photos.length - perPage);
  }

  function getDots() {
    return [...pagination.querySelectorAll('.dot')];
  }

  function buildDots(count) {
    pagination.innerHTML = '<span class="page-indicator" aria-hidden="true"></span>';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.type = 'button';
      dot.dataset.position = String(i);
      dot.setAttribute('aria-label', `Перейти к странице ${i + 1}`);
      dot.setAttribute('aria-controls', 'gallery-track');
      dot.addEventListener('click', () => {
        if (dragging) return;
        goTo(i);
      });
      pagination.append(dot);
    }
  }

  function updateCounter(nearest) {
    const first = nearest + 1;
    const last = Math.min(nearest + perPage, photos.length);
    currentLabel.textContent = String(first).padStart(2, '0');
    endLabel.textContent = String(last).padStart(2, '0');
    totalLabel.textContent = String(photos.length).padStart(2, '0');

    const single = perPage === 1;
    endLabel.hidden = single;
    counterDash.hidden = single;

    if (!pointerDown) {
      status.textContent = single
        ? `Фотография ${first} из ${photos.length}`
        : `Показаны фотографии ${first}–${last} из ${photos.length}`;
    }
  }

  function render() {
    perPage = visibleCount();
    position = Math.max(0, Math.min(position, maxPosition()));

    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const firstCard = track.querySelector('.card');
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 0;
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

    updateCounter(nearest);
    prev.disabled = position <= 0;
    next.disabled = position >= maxPosition();
  }

  function goTo(nextPosition) {
    position = Math.max(0, Math.min(Math.round(nextPosition), maxPosition()));
    render();
  }

  function goBy(delta) {
    goTo(Math.round(position) + delta);
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

  prev.addEventListener('click', () => goBy(-1));
  next.addEventListener('click', () => goBy(1));

  pagination.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    pointerDown = true;
    dragging = false;
    pointerStartX = event.clientX;
  });

  window.addEventListener('pointermove', (event) => {
    if (!pointerDown) return;
    if (Math.abs(event.clientX - pointerStartX) > 2) {
      dragging = true;
      pagination.classList.add('is-dragging');
      track.classList.add('is-dragging');
      position = positionFromPointer(event.clientX);
      render();
    }
  });

  function endDrag() {
    if (!pointerDown) return;
    pointerDown = false;
    if (dragging) {
      position = Math.round(position);
      pagination.classList.remove('is-dragging');
      track.classList.remove('is-dragging');
      render();
      window.setTimeout(() => { dragging = false; }, 80);
    } else {
      dragging = false;
    }
  }

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  track.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    swipeMoved = false;
  }, { passive: true });

  track.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;

    swipeMoved = true;
    goBy(dx < 0 ? 1 : -1);
    window.setTimeout(() => { swipeMoved = false; }, 400);
  }, { passive: true });

  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); goBy(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); goBy(1); }
    if (event.key === 'Home') { event.preventDefault(); goTo(0); }
    if (event.key === 'End') { event.preventDefault(); goTo(maxPosition()); }
  });

  function showLightbox(index) {
    lightboxIndex = (index + photos.length) % photos.length;
    const photo = photos[lightboxIndex];
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt;
    lightboxCaption.textContent = `${String(lightboxIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')} · ${photo.title} — ${photo.place}`;
  }

  function openLightbox(index) {
    showLightbox(index);
    if (!lightbox.open) {
      if (typeof lightbox.showModal === 'function') {
        lightbox.showModal();
      } else {
        lightbox.setAttribute('open', '');
      }
      document.body.classList.add('lightbox-open');
    }
  }

  function closeLightbox() {
    if (typeof lightbox.close === 'function' && lightbox.open) {
      lightbox.close();
    } else {
      lightbox.removeAttribute('open');
    }
    document.body.classList.remove('lightbox-open');
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => showLightbox(lightboxIndex - 1));
  lightboxNext.addEventListener('click', () => showLightbox(lightboxIndex + 1));

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  lightbox.addEventListener('close', () => {
    document.body.classList.remove('lightbox-open');
  });

  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showLightbox(lightboxIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showLightbox(lightboxIndex + 1); }
  });

  window.addEventListener('resize', render);
  render();
})();
