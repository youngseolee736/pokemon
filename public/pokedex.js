(() => {
  const API_BASE = 'https://pokeapi.co/api/v2';
  const PAGE_SIZE = 12;
  const form = document.querySelector('#pokedexSearchForm');
  const searchInput = document.querySelector('#pokemonSearch');
  const typeFilter = document.querySelector('#typeFilter');
  const clearButton = document.querySelector('#clearFiltersBtn');
  const loading = document.querySelector('#pokedexLoading');
  const message = document.querySelector('#pokedexMessage');
  const grid = document.querySelector('#pokedexGrid');
  const previousButton = document.querySelector('#previousPageBtn');
  const nextButton = document.querySelector('#nextPageBtn');
  const pageIndicator = document.querySelector('#pageIndicator');
  const dialog = document.querySelector('#pokemonDialog');
  const dialogContent = document.querySelector('#pokemonDialogContent');
  const closeDialogButton = document.querySelector('#closePokemonDialog');
  let pokemonIndex = [], currentPage = 1, totalPages = 1, requestNumber = 0;
  const typeCache = new Map(), detailCache = new Map();

  const titleCase = (value) => value.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  async function fetchJson(url) { const response = await fetch(url); if (!response.ok) throw new Error(`PokéAPI returned ${response.status}.`); return response.json(); }
  function setLoading(value) { loading.hidden = !value; grid.setAttribute('aria-busy', String(value)); previousButton.disabled = value || currentPage <= 1; nextButton.disabled = value || currentPage >= totalPages; }
  function showError() { message.className = 'pokedex-message error'; message.textContent = 'We could not reach PokéAPI. Check your connection and try again. '; const button = document.createElement('button'); button.type = 'button'; button.className = 'ghost-btn'; button.textContent = 'Retry'; button.addEventListener('click', initialize); message.appendChild(button); }
  function populateTypes(types) { types.filter((type) => !['unknown', 'shadow'].includes(type.name)).forEach((type) => { const option = document.createElement('option'); option.value = type.name; option.textContent = titleCase(type.name); typeFilter.appendChild(option); }); }
  async function getPokemonPool() { const type = typeFilter.value; if (!type) return pokemonIndex; if (!typeCache.has(type)) { const data = await fetchJson(`${API_BASE}/type/${type}`); typeCache.set(type, data.pokemon.map((entry) => entry.pokemon)); } return typeCache.get(type); }
  async function getPokemonDetail(entry) { if (!detailCache.has(entry.name)) detailCache.set(entry.name, fetchJson(entry.url)); try { return await detailCache.get(entry.name); } catch (error) { detailCache.delete(entry.name); throw error; } }
  function renderCards(list) { grid.innerHTML = ''; list.forEach((pokemon, index) => { const card = document.createElement('article'); const image = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default || ''; const types = pokemon.types.map((entry) => entry.type.name); card.className = 'pokedex-item'; card.style.animationDelay = `${index * 35}ms`; card.innerHTML = `<span class="pokemon-number">#${String(pokemon.id).padStart(4, '0')}</span><img src="${image}" alt="${titleCase(pokemon.name)} official artwork" loading="lazy" /><h3>${titleCase(pokemon.name)}</h3><div class="type-list">${types.map((type) => `<span class="type-pill">${type}</span>`).join('')}</div><button class="details-btn" type="button">View details</button>`; card.querySelector('.details-btn').addEventListener('click', () => openDetails(pokemon)); grid.appendChild(card); }); }
  async function loadPage() { const request = ++requestNumber; setLoading(true); message.className = 'pokedex-message'; message.textContent = ''; try { const pool = await getPokemonPool(); const query = searchInput.value.trim().toLowerCase(); const filtered = pool.filter((pokemon) => pokemon.name.includes(query)); totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); currentPage = Math.min(currentPage, totalPages); const start = (currentPage - 1) * PAGE_SIZE; const entries = filtered.slice(start, start + PAGE_SIZE); const settled = await Promise.allSettled(entries.map(getPokemonDetail)); const details = settled.filter((result) => result.status === 'fulfilled').map((result) => result.value); if (request !== requestNumber) return; renderCards(details); pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`; if (!filtered.length) message.textContent = 'No Pokémon matched those filters. Try another name or type.'; else if (!details.length) throw new Error('Details unavailable'); else message.textContent = `Showing ${start + 1}–${Math.min(start + entries.length, filtered.length)} of ${filtered.length} Pokémon.`; } catch (error) { if (request !== requestNumber) return; grid.innerHTML = ''; showError(); } finally { if (request === requestNumber) setLoading(false); } }
  const descriptionFor = (species) => { const entry = species.flavor_text_entries.find((item) => item.language.name === 'en'); return entry ? entry.flavor_text.replace(/[\n\f]/g, ' ') : 'No English description is available.'; };
  function renderDialog(pokemon, description) { const image = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default || ''; const types = pokemon.types.map((entry) => entry.type.name); const stats = pokemon.stats.map((entry) => `<div class="stat-row"><span>${titleCase(entry.stat.name)}</span><div class="stat-track"><div class="stat-fill" style="width:${Math.min(100, Math.round((entry.base_stat / 180) * 100))}%"></div></div><span>${entry.base_stat}</span></div>`).join(''); dialogContent.innerHTML = `<div class="dialog-summary"><img src="${image}" alt="${titleCase(pokemon.name)} official artwork" /><div class="dialog-copy"><span class="pokemon-number">#${String(pokemon.id).padStart(4, '0')}</span><h2 id="dialogPokemonName">${titleCase(pokemon.name)}</h2><div class="type-list">${types.map((type) => `<span class="type-pill">${type}</span>`).join('')}</div><p><strong>Height:</strong> ${(pokemon.height / 10).toFixed(1)} m</p><p><strong>Weight:</strong> ${(pokemon.weight / 10).toFixed(1)} kg</p><p class="dialog-description">${description}</p></div></div><h3 class="stats-title">Base stats</h3><div>${stats}</div>`; }
  async function openDetails(pokemon) { dialogContent.innerHTML = '<div class="pokedex-loading"><div class="pokeball-spinner" aria-hidden="true"></div><span>Loading details...</span></div>'; dialog.showModal(); try { const species = await fetchJson(pokemon.species.url); renderDialog(pokemon, descriptionFor(species)); } catch (error) { renderDialog(pokemon, 'The description could not be loaded, but the Pokémon data is still available.'); } }
  async function initialize() { setLoading(true); message.className = 'pokedex-message'; message.textContent = ''; try { const [index, types] = await Promise.all([fetchJson(`${API_BASE}/pokemon?limit=2000`), fetchJson(`${API_BASE}/type`)]); pokemonIndex = index.results; if (typeFilter.options.length === 1) populateTypes(types.results); await loadPage(); } catch (error) { setLoading(false); showError(); } }
  form.addEventListener('submit', (event) => { event.preventDefault(); currentPage = 1; loadPage(); });
  typeFilter.addEventListener('change', () => { currentPage = 1; loadPage(); });
  clearButton.addEventListener('click', () => { searchInput.value = ''; typeFilter.value = ''; currentPage = 1; loadPage(); });
  previousButton.addEventListener('click', () => { if (currentPage > 1) { currentPage -= 1; loadPage(); } });
  nextButton.addEventListener('click', () => { if (currentPage < totalPages) { currentPage += 1; loadPage(); } });
  closeDialogButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  initialize();
})();
