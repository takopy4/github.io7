(() => {
  // Фотографии: Pexels (бесплатно для использования без обязательной атрибуции)
  const photos = [
    { src: 'images/tokyo-neon-traveler.jpg', title: 'Огни Токио', place: 'Вечерний город', alt: 'Ночная улица Синдзюку в Токио: неоновые огни и мокрый асфальт после дождя' },
    { src: 'images/tokyo-alley-ride.jpg', title: 'Тихий переулок', place: 'Токио, Япония', alt: 'Велосипедистка едет по узкой улице Токио между зданиями с неоновыми вывесками' },
    { src: 'images/tokyo-shop-street.jpg', title: 'Улица старого города', place: 'Японский квартал', alt: 'Торговая улочка старого Токио с яркими вывесками и бумажными фонарями' },
    { src: 'images/shibuya-sunset.jpg', title: 'Закат над городом', place: 'Сибуя, Токио', alt: 'Силуэт района Сибуя в Токио в вечерних сумерках' },
    { src: 'images/tokyo-golden-hour.jpg', title: 'Золотой час', place: 'Токио, Япония', alt: 'Прохожие на городской улице в закатных лучах солнца, длинные тени' },
    { src: 'images/kyoto-matcha.jpg', title: 'Матча-пауза', place: 'Киото, Япония', alt: 'Традиционная чайная комната в Киото, гости беседуют за чаем' },
    { src: 'images/kyoto-cafe.jpg', title: 'Кофе по пути', place: 'Уличная кофейня', alt: 'Уютная кофейня на углу улицы, гости сидят снаружи с кофе' },
    { src: 'images/venice-beach-blue-hour.jpg', title: 'Синий час', place: 'Венеция, Калифорния', alt: 'Знаменитая вывеска Venice Beach и силуэты пальм в сумерках' }
  ];

  const track = document.querySelector('#gallery-track');
  const viewport = document.querySelector('.viewport');
  const prev = document.querySelector('.arrow--prev');
  const next = document.querySelector('.arrow--next');
  const dotsBox = document.querySelector('#pagination');
  const currentLabel = document.querySelector('#current-page');
  const endLabel = document.querySelector('#end-page');
  const dashLabel = document.querySelector('.counter-dash');
  const totalLabel = document.querySelector('#total-pages');
  const status = document.querySelector('#gallery-status');

  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = document.querySelector('#lightbox-image');
  const lightboxCaption = document.querySelector('#lightbox-caption');

  let position = 0; // индекс первой видимой карточки
  let lightboxIndex = 0;
  let swipeMoved = false; // клик после свайпа не должен открывать лайтбокс
  let touchX = 0;
  let touchY = 0;

  /* ---------- создание карточек ---------- */

  photos.forEach((photo, index) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.style.animationDelay = `${index * 60}ms`;

    card.innerHTML = `
      <img src="${photo.src}" alt="${photo.alt}" width="1000" height="1250"
           ${index > 2 ? 'loading="lazy"' : ''} decoding="async" draggable="false">
      <div class="card-caption">
        <strong>${photo.title}</strong>
        <span>${photo.place}</span>
      </div>
      <button class="card-open" type="button" aria-label="Открыть фотографию: ${photo.title}"></button>`;

    // если файл картинки не найден — показываем аккуратную заглушку
    const img = card.querySelector('img');
    img.addEventListener('error', () => {
      card.classList.add('is-missing');
      img.remove();
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

  /* ---------- раскладка ---------- */

  // сколько карточек видно за раз (брейкпоинты как в style.css)
  function getPerPage() {
    if (window.matchMedia('(max-width: 520px)').matches) return 1;
    if (window.matchMedia('(max-width: 820px)').matches) return 2;
    return 3;
  }

  function maxPosition() {
    return Math.max(0, photos.length - getPerPage());
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  /* ---------- отрисовка состояния ---------- */

  function render() {
    position = Math.max(0, Math.min(position, maxPosition()));

    // сдвиг ленты: ширина карточки + отступ
    const firstCard = track.querySelector('.card');
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const step = firstCard ? firstCard.getBoundingClientRect().width + gap : 0;
    track.style.transform = `translate3d(${-position * step}px, 0, 0)`;

    // точки пагинации
    const pages = maxPosition() + 1;
    if (dotsBox.children.length !== pages) buildDots(pages);
    [...dotsBox.children].forEach((dot, i) => {
      dot.classList.toggle('active', i === position);
      dot.setAttribute('aria-current', String(i === position));
    });

    // счётчик вида «01–03 / 08»
    const perPage = getPerPage();
    const first = position + 1;
    const last = Math.min(position + perPage, photos.length);
    currentLabel.textContent = pad(first);
    endLabel.textContent = pad(last);
    totalLabel.textContent = pad(photos.length);
    endLabel.hidden = perPage === 1;
    dashLabel.hidden = perPage === 1;

    // текст для скринридеров
    status.textContent = perPage === 1
      ? `Фотография ${first} из ${photos.length}`
      : `Показаны фотографии ${first}–${last} из ${photos.length}`;

    // стрелки гаснут у краёв
    prev.disabled = position <= 0;
    next.disabled = position >= maxPosition();
  }

  function buildDots(count) {
    dotsBox.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', `Перейти к странице ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsBox.append(dot);
    }
  }

  /* ---------- навигация ---------- */

  function goTo(index) {
    position = Math.max(0, Math.min(index, maxPosition()));
    render();
  }

  function goBy(delta) {
    goTo(position + delta);
  }

  prev.addEventListener('click', () => goBy(-1));
  next.addEventListener('click', () => goBy(1));

  // свайп на сенсорных экранах
  track.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchX = touch.clientX;
    touchY = touch.clientY;
    swipeMoved = false;
  }, { passive: true });

  track.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchX;
    const dy = touch.clientY - touchY;

    // короткое или вертикальное движение — это скролл, а не свайп
    if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;

    swipeMoved = true;
    goBy(dx < 0 ? 1 : -1);
    window.setTimeout(() => { swipeMoved = false; }, 400);
  }, { passive: true });

  // клавиатура
  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); goBy(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); goBy(1); }
    if (event.key === 'Home') { event.preventDefault(); goTo(0); }
    if (event.key === 'End') { event.preventDefault(); goTo(maxPosition()); }
  });

  /* ---------- лайтбокс ---------- */

  function showLightbox(index) {
    lightboxIndex = (index + photos.length) % photos.length;
    const photo = photos[lightboxIndex];
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt;
    lightboxCaption.textContent =
      `${pad(lightboxIndex + 1)} / ${pad(photos.length)} · ${photo.title} — ${photo.place}`;
  }

  function openLightbox(index) {
    showLightbox(index);
    if (!lightbox.open) {
      lightbox.showModal(); // нативный <dialog>: Esc и фокус из коробки
      document.body.style.overflow = 'hidden';
    }
  }

  document.querySelector('.lb-close').addEventListener('click', () => lightbox.close());
  document.querySelector('.lb-prev').addEventListener('click', () => showLightbox(lightboxIndex - 1));
  document.querySelector('.lb-next').addEventListener('click', () => showLightbox(lightboxIndex + 1));

  // клик по тёмной подложке закрывает просмотр
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  lightbox.addEventListener('close', () => {
    document.body.style.overflow = '';
  });

  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showLightbox(lightboxIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showLightbox(lightboxIndex + 1); }
  });

  /* ---------- старт ---------- */

  window.addEventListener('resize', render);
  render();
})();
