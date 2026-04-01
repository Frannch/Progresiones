function buildCategoryCards({ label, baseFolder, totalPages, startOddPage = 1 }) {
  const cards = [];
  let cardNumber = 1;

  for (let oddPage = startOddPage; oddPage < startOddPage + totalPages; oddPage += 2) {
    const evenPage = oddPage + 1;

    cards.push({
      name: `${label} ${cardNumber}`,
      frontImage: `${baseFolder}/paginas_impares/impar_pag_${oddPage}.png`,
      backImage: `${baseFolder}/paginas_pares/par_pag_${evenPage}.png`
    });

    cardNumber += 1;
  }

  return cards;
}

const categories = [
  {
    id: 'planificacion',
    title: 'Salud y Bienestar',
    subtitle: 'texto de ejemplo',
    accent: '#181cec',
    description: 'texto de ejemplo',
    items: buildCategoryCards({
      label: 'Salud',
      baseFolder: 'Salud',
      totalPages: 28
    })
  },
  {
    id: 'contenido',
    title: 'Paz y Desarrollo',
    subtitle: 'texto de ejemplo2',
    accent: '#592cd3',
    description: 'otro texto de ejemplo.',
    items: buildCategoryCards({
      label: 'Paz',
      baseFolder: 'Paz',
      totalPages: 28
    })
  },
  {
    id: 'validacion',
    title: 'Ambiente',
    subtitle: '---',
    accent: '#3ba326',
    description: '---',
    items: buildCategoryCards({
      label: 'Amb',
      baseFolder: 'Amb',
      totalPages: 14
    })
  },
  {
    id: 'entrega',
    title: 'Habilidades Para La Vida',
    subtitle: 'ejemplo',
    accent: '#f0821c',
    description: 'ejemplo de descripción.',
    items: buildCategoryCards({
      label: 'Hab',
      baseFolder: 'Hab',
      totalPages: 28
    })
  }
];

const categoriesRoot = document.getElementById('categories');
const categoryFilters = document.getElementById('categoryFilters');
const fullscreenBackdrop = document.getElementById('fullscreenBackdrop');
let activeCategoryId = categories[0].id;
let expandedCardId = null;

function buildPlaceholder(label, accent) {
  const encodedLabel = encodeURIComponent(label);
  const bgColor = accent.replace('#', '');
  return `https://placehold.co/520x760/${bgColor}/ffffff?text=${encodedLabel}`;
}

function renderFilters() {
  categoryFilters.innerHTML = categories.map((category) => `
    <button
      type="button"
      class="filter-button ${category.id === activeCategoryId ? 'is-active' : ''}"
      data-category-id="${category.id}"
      aria-pressed="${category.id === activeCategoryId}"
    >
      ${category.title}
    </button>
  `).join('');
}

function renderCategories() {
  categoriesRoot.innerHTML = categories.map((category) => {
    const cards = category.items.map((item, index) => `
      <article class="card-wrap" style="--accent: ${category.accent};" data-card-id="${category.id}-${index}">
        <button
          type="button"
          class="card-visual"
          data-action="expand"
          data-card-id="${category.id}-${index}"
          aria-label="Ampliar tarjeta ${item.name}"
        >
          <div class="card-3d">
            <div class="card-face card-front">
              <img src="${item.frontImage || buildPlaceholder(`${item.name} Frente`, category.accent)}" alt="Imagen frontal de ${item.name}">
            </div>
            <div class="card-face card-back">
              <img src="${item.backImage || buildPlaceholder(`${item.name} Dorso`, '#31343a')}" alt="Imagen trasera de ${item.name}">
            </div>
          </div>
        </button>
        <div class="card-footer">
          <button type="button" class="flip-button" data-action="flip" data-card-id="${category.id}-${index}">Voltear</button>
        </div>
      </article>
    `).join('');

    return `
      <section class="category" style="--accent: ${category.accent};" ${category.id === activeCategoryId ? '' : 'hidden'}>
        <header class="category-header">
          <div class="category-title">
            <span class="category-badge" style="background: ${category.accent};"></span>
            <div>
              <h2>${category.title}</h2>
              <p>${category.subtitle}</p>
            </div>
          </div>
          <p class="category-count">${category.items.length} tarjetas</p>
        </header>
        <p class="hero-text">${category.description}</p>
        <div class="cards">${cards}</div>
      </section>
    `;
  }).join('');
}

function updateView(categoryId) {
  closeExpandedCard();
  activeCategoryId = categoryId;
  renderFilters();
  renderCategories();
}

function toggleExpanded(cardId) {
  const selectedCard = categoriesRoot.querySelector(`.card-wrap[data-card-id="${cardId}"]`);

  if (!selectedCard) {
    return;
  }

  const shouldExpand = expandedCardId !== cardId;

  closeExpandedCard();

  if (shouldExpand) {
    const frontImage = selectedCard.querySelector('.card-front img');
    const imageWidth = frontImage?.naturalWidth || 3;
    const imageHeight = frontImage?.naturalHeight || 4;
    const ratio = imageWidth / imageHeight;

    selectedCard.style.setProperty('--media-ratio', String(ratio));
    selectedCard.classList.add('is-fullscreen');
    expandedCardId = cardId;
    fullscreenBackdrop.hidden = false;
    document.body.classList.add('has-fullscreen-card');
  }
}

function closeExpandedCard() {
  categoriesRoot.querySelectorAll('.card-wrap.is-fullscreen').forEach((card) => {
    card.classList.remove('is-fullscreen');
    card.style.removeProperty('--media-ratio');
  });

  expandedCardId = null;
  fullscreenBackdrop.hidden = true;
  document.body.classList.remove('has-fullscreen-card');
}

function toggleFlipped(cardId) {
  const selectedCard = categoriesRoot.querySelector(`.card-wrap[data-card-id="${cardId}"]`);

  if (!selectedCard) {
    return;
  }

  selectedCard.classList.toggle('is-flipped');
}

categoriesRoot.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');

  if (!button) {
    return;
  }

  if (button.dataset.action === 'expand') {
    toggleExpanded(button.dataset.cardId);
    return;
  }

  if (button.dataset.action === 'flip') {
    toggleFlipped(button.dataset.cardId);
  }
});

categoryFilters.addEventListener('click', (event) => {
  const button = event.target.closest('.filter-button');

  if (!button || button.dataset.categoryId === activeCategoryId) {
    return;
  }

  updateView(button.dataset.categoryId);
});

fullscreenBackdrop.addEventListener('click', closeExpandedCard);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeExpandedCard();
  }
});

renderFilters();
renderCategories();
