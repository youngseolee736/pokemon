const form = document.querySelector('#uploadForm');
const imageInput = document.querySelector('#imageInput');
const statusMessage = document.querySelector('#statusMessage');
const resultsGrid = document.querySelector('#resultsGrid');
const previewImage = document.querySelector('#previewImage');
const previewText = document.querySelector('#previewText');
const previewPlaceholder = document.querySelector('#previewPlaceholder');
const takePhotoBtn = document.querySelector('#takePhotoBtn');
const capturePhotoBtn = document.querySelector('#capturePhotoBtn');
const closeCameraBtn = document.querySelector('#closeCameraBtn');
const cameraPanel = document.querySelector('#cameraPanel');
const liveVideo = document.querySelector('#liveVideo');
const tryAgainBtn = document.querySelector('#tryAgainBtn');
const submitBtn = document.querySelector('.submit-btn');
const changePhotoBtn = document.querySelector('#changePhotoBtn');
const resultsCard = document.querySelector('#resultsCard');
const favoritesPanel = document.querySelector('#favoritesPanel');
const favoritesCount = document.querySelector('#favoritesCount');
const favoritesList = document.querySelector('#favoritesList');
const loadingShell = document.querySelector('#loadingShell');
const loadingHeadline = document.querySelector('#loadingHeadline');
const loadingSubtext = document.querySelector('#loadingSubtext');

const favoritesKey = 'pokemon-face-favorites';
const vibeMap = {
  Pikachu: 'Playful',
  Charmander: 'Bold',
  Bulbasaur: 'Calm',
  Charizard: 'Powerful',
  Mewtwo: 'Mystic',
  Pidgey: 'Light'
};

const loadingMessages = [
  {
    headline: 'Scanning your Poké-vibe...',
    subtext: 'Comparing your energy...'
  },
  {
    headline: 'Finding your Pokémon squad...',
    subtext: 'Checking the energy match...'
  },
  {
    headline: 'Opening the Pokédex...',
    subtext: 'Pulling your top five...'
  }
];

const demoResults = [
  {
    name: 'Pikachu',
    type: 'Electric',
    vibe: 'Playful',
    artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    similarity: 93,
    reason: 'Bright eyes and an energetic expression match Pikachu’s lively look.'
  },
  {
    name: 'Charmander',
    type: 'Fire',
    vibe: 'Bold',
    artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',
    similarity: 86,
    reason: 'A strong expression and confident energy fit Charmander’s bold personality.'
  },
  {
    name: 'Bulbasaur',
    type: 'Grass, Poison',
    vibe: 'Calm',
    artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
    similarity: 78,
    reason: 'Soft features and a calm mood suggest a gentle Bulbasaur-like vibe.'
  },
  {
    name: 'Charizard',
    type: 'Fire, Flying',
    vibe: 'Powerful',
    artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
    similarity: 73,
    reason: 'A confident expression lines up with Charizard’s powerful presence.'
  },
  {
    name: 'Pidgey',
    type: 'Normal, Flying',
    vibe: 'Light',
    artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/16.png',
    similarity: 71,
    reason: 'An approachable expression fits Pidgey’s light and friendly energy.'
  }
];

let mediaStream = null;
let currentResults = [];
let favoriteMap = loadFavoriteMap();
let loadingTimer = null;
let loadingMessageIndex = 0;
const pokemonStatsCache = new Map();
const radarStats = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'ATK' },
  { key: 'defense', label: 'DEF' },
  { key: 'special-attack', label: 'SP.A' },
  { key: 'special-defense', label: 'SP.D' },
  { key: 'speed', label: 'SPD' }
];

function loadFavoriteMap() {
  try {
    const stored = JSON.parse(localStorage.getItem(favoritesKey) || '[]');

    if (!Array.isArray(stored)) {
      return new Map();
    }

    return new Map(
      stored.map((item) => {
        if (typeof item === 'string') {
          return [item, { name: item, artwork: '', vibe: vibeMap[item] || 'Curious', type: 'Unknown', similarity: 0 }];
        }

        return [item.name, item];
      })
    );
  } catch (error) {
    return new Map();
  }
}

function persistFavorites() {
  localStorage.setItem(favoritesKey, JSON.stringify(Array.from(favoriteMap.values())));
}

function renderFavorites() {
  favoritesList.innerHTML = '';
  const favorites = Array.from(favoriteMap.values());
  favoritesCount.textContent = String(favorites.length);

  if (!favorites.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'favorites-empty';
    emptyState.textContent = 'No favorites yet. Save a Pokémon from the results.';
    favoritesList.appendChild(emptyState);
    return;
  }

  favorites.forEach((pokemon) => {
    const favoriteItem = document.createElement('button');
    favoriteItem.type = 'button';
    favoriteItem.className = 'favorite-item';
    favoriteItem.innerHTML = `
      <img src="${pokemon.artwork || ''}" alt="${pokemon.name}" />
      <span>${pokemon.name}</span>
    `;

    favoriteItem.addEventListener('click', () => {
      favoriteMap.delete(pokemon.name);
      persistFavorites();
      renderFavorites();

      if (currentResults.length) {
        renderResults(currentResults);
      }

      statusMessage.textContent = `${pokemon.name} removed from favorites.`;
    });

    favoritesList.appendChild(favoriteItem);
  });
}

function showPreview(file) {
  if (!file) {
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  previewImage.src = objectUrl;
  previewImage.classList.add('visible');
  previewPlaceholder.hidden = true;
  previewText.textContent = `Selected photo: ${file.name}`;
  submitBtn.textContent = 'Reveal My Matches';
  changePhotoBtn.hidden = false;
}

function resetPreview() {
  previewImage.classList.remove('visible');
  previewImage.src = '';
  previewPlaceholder.hidden = false;
  previewText.textContent = 'Good lighting works best!';
  imageInput.value = '';
  submitBtn.textContent = 'Find My Pokémon';
  changePhotoBtn.hidden = true;
}

function showLoadingState() {
  loadingShell.hidden = false;
  resultsCard.classList.add('is-hidden');
  favoritesPanel.classList.add('is-hidden');
  loadingMessageIndex = 0;

  loadingHeadline.textContent = loadingMessages[loadingMessageIndex].headline;
  loadingSubtext.textContent = loadingMessages[loadingMessageIndex].subtext;

  loadingTimer = window.setInterval(() => {
    loadingMessageIndex = (loadingMessageIndex + 1) % loadingMessages.length;
    loadingHeadline.textContent = loadingMessages[loadingMessageIndex].headline;
    loadingSubtext.textContent = loadingMessages[loadingMessageIndex].subtext;
  }, 1000);
}

function hideLoadingState() {
  if (loadingTimer) {
    window.clearInterval(loadingTimer);
    loadingTimer = null;
  }

  loadingShell.hidden = true;
}

function resetAnalysisState() {
  currentResults = [];
  resultsGrid.innerHTML = '';
  resultsCard.classList.add('is-hidden');
  favoritesPanel.classList.add('is-hidden');
  resetPreview();
  statusMessage.textContent = 'Please upload a photo to begin.';
  window.dispatchEvent(new CustomEvent('pokemonmatchesreset'));
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
  }

  mediaStream = null;
  liveVideo.srcObject = null;
  cameraPanel.classList.remove('visible');
  capturePhotoBtn.disabled = true;
  closeCameraBtn.disabled = true;
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    statusMessage.textContent = 'Your browser does not support direct camera access.';
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user'
      },
      audio: false
    });

    liveVideo.srcObject = mediaStream;
    cameraPanel.classList.add('visible');
    capturePhotoBtn.disabled = false;
    closeCameraBtn.disabled = false;
    statusMessage.textContent = 'Camera is ready. Capture the photo when you are ready.';
  } catch (error) {
    statusMessage.textContent = 'Camera access was denied. You can still attach a photo from your device.';
  }
}

function assignFile(file) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  imageInput.files = dataTransfer.files;
  showPreview(file);
}

function capturePhoto() {
  if (!liveVideo.videoWidth || !liveVideo.videoHeight) {
    statusMessage.textContent = 'Camera is not ready yet. Try again in a moment.';
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = liveVideo.videoWidth;
  canvas.height = liveVideo.videoHeight;

  const context = canvas.getContext('2d');
  context.drawImage(liveVideo, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    if (!blob) {
      statusMessage.textContent = 'Unable to capture the photo. Please try again.';
      return;
    }

    const capturedFile = new File([blob], 'camera-capture.png', { type: 'image/png' });
    assignFile(capturedFile);
    stopCamera();
    statusMessage.textContent = 'Photo captured successfully. You can now analyze it.';
  }, 'image/png');
}

function pokemonApiSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function getPokemonStats(name) {
  const slug = pokemonApiSlug(name);
  if (!pokemonStatsCache.has(slug)) {
    const request = fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`)
      .then((response) => { if (!response.ok) throw new Error(`PokéAPI returned ${response.status}`); return response.json(); })
      .then((data) => Object.fromEntries(data.stats.map((entry) => [entry.stat.name, entry.base_stat])))
      .catch((error) => { pokemonStatsCache.delete(slug); throw error; });
    pokemonStatsCache.set(slug, request);
  }
  return pokemonStatsCache.get(slug);
}

function radarPoint(index, radius, centerX = 105, centerY = 86) {
  const angle = (-90 + index * 60) * (Math.PI / 180);
  return { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
}

function radarPoints(radius) {
  return radarStats.map((_stat, index) => { const point = radarPoint(index, radius); return `${point.x.toFixed(1)},${point.y.toFixed(1)}`; }).join(' ');
}

function renderStatsRadar(container, stats, pokemonName) {
  const values = radarStats.map((stat) => stats[stat.key] || 0);
  const dataPoints = values.map((value, index) => { const point = radarPoint(index, 58 * Math.min(value / 180, 1)); return `${point.x.toFixed(1)},${point.y.toFixed(1)}`; }).join(' ');
  const grid = [0.25, 0.5, 0.75, 1].map((level) => `<polygon class="radar-grid" points="${radarPoints(58 * level)}" />`).join('');
  const axes = radarStats.map((_stat, index) => { const point = radarPoint(index, 58); return `<line class="radar-axis" x1="105" y1="86" x2="${point.x.toFixed(1)}" y2="${point.y.toFixed(1)}" />`; }).join('');
  const labels = radarStats.map((stat, index) => { const point = radarPoint(index, 76); return `<text class="radar-label" x="${point.x.toFixed(1)}" y="${point.y.toFixed(1)}"><tspan x="${point.x.toFixed(1)}">${stat.label}</tspan><tspan class="radar-value" x="${point.x.toFixed(1)}" dy="10">${values[index]}</tspan></text>`; }).join('');
  const total = values.reduce((sum, value) => sum + value, 0);
  container.innerHTML = `<div class="stats-heading"><h3>Base Stats</h3><span>Total ${total}</span></div><svg class="stat-radar" viewBox="0 0 210 175" role="img" aria-label="${pokemonName} base stats radar chart"><title>${pokemonName} base stats</title>${grid}${axes}<polygon class="radar-data" points="${dataPoints}" />${dataPoints.split(' ').map((point) => { const [x, y] = point.split(','); return `<circle class="radar-point" cx="${x}" cy="${y}" r="2.5" />`; }).join('')}${labels}</svg>`;
}

async function loadCardStats(card, pokemon) {
  const container = card.querySelector('.result-stats');
  try {
    const stats = await getPokemonStats(pokemon.name);
    if (card.isConnected) renderStatsRadar(container, stats, pokemon.name);
  } catch (error) {
    if (card.isConnected) container.innerHTML = '<p class="stats-error">Stats unavailable.</p>';
  }
}

function createResultCard(pokemon, isFeatured = false) {
  const card = document.createElement('article');
  card.className = `result-card${isFeatured ? ' featured-card' : ''}`;

  const isFavorite = favoriteMap.has(pokemon.name);
  const vibe = pokemon.vibe || vibeMap[pokemon.name] || 'Curious';

  card.innerHTML = `
    <div class="result-top">
      <span class="result-vibe">${vibe}</span>
      <button class="favorite-btn ${isFavorite ? 'active' : ''}" type="button" data-name="${pokemon.name}">${isFavorite ? '♥ Saved' : '♡ Save'}</button>
    </div>
    <div class="result-media">
      <img src="${pokemon.artwork}" alt="${pokemon.name}" />
    </div>
    <div class="result-body">
      <div class="result-copy">
        <h2 class="result-name">${pokemon.name}</h2>
        <p class="result-type">Type: ${pokemon.type}</p>
        <p class="result-score">Match: ${pokemon.similarity}%</p>
        <p class="result-reason">${pokemon.reason}</p>
      </div>
      <div class="result-stats" aria-live="polite">
        <div class="stats-loading"><span class="mini-spinner" aria-hidden="true"></span>Loading stats...</div>
      </div>
    </div>
    <div class="result-footer">
      <button class="share-btn" type="button">Share Result</button>
    </div>
  `;

  loadCardStats(card, pokemon);

  const favoriteButton = card.querySelector('.favorite-btn');
  favoriteButton.addEventListener('click', () => {
    if (favoriteMap.has(pokemon.name)) {
      favoriteMap.delete(pokemon.name);
      statusMessage.textContent = `${pokemon.name} removed from favorites.`;
    } else {
      favoriteMap.set(pokemon.name, {
        name: pokemon.name,
        artwork: pokemon.artwork,
        type: pokemon.type,
        similarity: pokemon.similarity,
        vibe
      });
      statusMessage.textContent = `${pokemon.name} saved to favorites.`;
    }

    persistFavorites();
    renderFavorites();
    renderResults(currentResults);
  });

  const shareButton = card.querySelector('.share-btn');
  shareButton.addEventListener('click', async () => {
    const shareText = `${pokemon.name} is your vibe match at ${pokemon.similarity}% on Poké Vibe Finder.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Poké Vibe Finder',
          text: shareText
        });
        statusMessage.textContent = `${pokemon.name} result shared.`;
      } catch (error) {
        statusMessage.textContent = 'Share canceled.';
      }
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      statusMessage.textContent = 'Match text copied to your clipboard.';
    }
  });

  return card;
}

function renderResults(results) {
  const isNewMatchSet = results !== currentResults;
  currentResults = results;
  resultsGrid.innerHTML = '';
  resultsCard.classList.remove('is-hidden');
  favoritesPanel.classList.remove('is-hidden');

  const featuredCard = createResultCard(results[0], true);
  resultsGrid.appendChild(featuredCard);

  const miniGrid = document.createElement('div');
  miniGrid.className = 'mini-results-grid';

  results.slice(1).forEach((pokemon) => {
    miniGrid.appendChild(createResultCard(pokemon));
  });

  resultsGrid.appendChild(miniGrid);
  renderFavorites();
  if (isNewMatchSet) {
    window.dispatchEvent(new CustomEvent('pokemonmatchesready', { detail: { results } }));
  }
}

takePhotoBtn.addEventListener('click', async () => {
  await startCamera();
});

capturePhotoBtn.addEventListener('click', () => {
  capturePhoto();
});

closeCameraBtn.addEventListener('click', () => {
  stopCamera();
  statusMessage.textContent = 'Camera closed. You can still attach a photo from your device.';
});

changePhotoBtn.addEventListener('click', () => {
  resetPreview();
});

tryAgainBtn.addEventListener('click', () => {
  resetAnalysisState();
});

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];

  if (!file) {
    return;
  }

  showPreview(file);
});

renderFavorites();

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const file = imageInput.files[0];
  if (!file) {
    statusMessage.textContent = 'Please choose or capture a photo first.';
    return;
  }

  showLoadingState();
  statusMessage.textContent = 'Scanning your Poké-vibe...';

  try {
    const isGitHubPages = window.location.hostname.endsWith('.github.io');

    if (isGitHubPages) {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      hideLoadingState();
      renderResults(demoResults);
      statusMessage.textContent = 'Your demo Pokémon matches are ready.';
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });

    if (response.status === 404 || response.status === 405) {
      hideLoadingState();
      renderResults(demoResults);
      statusMessage.textContent = 'Your demo Pokémon matches are ready.';
      return;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('The analysis server returned an invalid response.');
    }

    const payload = await response.json();

    if (!response.ok || !Array.isArray(payload.results) || !payload.results.length) {
      throw new Error(payload.error || 'Analysis failed.');
    }

    hideLoadingState();
    renderResults(payload.results);
    statusMessage.textContent = 'Your top five Pokémon matches are ready.';
  } catch (error) {
    hideLoadingState();
    console.error('Error:', error);
    statusMessage.textContent = `Error: ${error.message} Please try again.`;
  }
});

resetAnalysisState();
