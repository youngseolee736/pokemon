(() => {
  const API_BASE = 'https://pokeapi.co/api/v2';
  const WINS_PREFIX = 'type-battle-wins-';
  const TYPE_CHART = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
  };

  const game = document.querySelector('#matchGame');
  const roster = document.querySelector('#gameRoster');
  const winsDisplay = document.querySelector('#battleWins');
  const startButton = document.querySelector('#startBattleBtn');
  const moveButtons = document.querySelector('#moveButtons');
  const message = document.querySelector('#battleMessage');
  const playerName = document.querySelector('#playerName');
  const playerTypes = document.querySelector('#playerTypes');
  const playerHpText = document.querySelector('#playerHpText');
  const playerHpBar = document.querySelector('#playerHpBar');
  const playerSprite = document.querySelector('#playerSprite');
  const enemyName = document.querySelector('#enemyName');
  const enemyTypes = document.querySelector('#enemyTypes');
  const enemyHpText = document.querySelector('#enemyHpText');
  const enemyHpBar = document.querySelector('#enemyHpBar');
  const enemySprite = document.querySelector('#enemySprite');

  let matches = [];
  let selectedMatch = null;
  let player = null;
  let enemy = null;
  let playerMoves = [];
  let enemyMoves = [];
  let playerHp = 0;
  let enemyHp = 0;
  let playerMaxHp = 0;
  let enemyMaxHp = 0;
  let battleActive = false;
  let turnInProgress = false;

  function titleCase(value) {
    return value.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`PokéAPI returned ${response.status}.`);
    return response.json();
  }

  function pokemonSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function getWins() {
    try {
      return Number(localStorage.getItem(`${WINS_PREFIX}${selectedMatch?.name || 'unknown'}`)) || 0;
    } catch (error) {
      return 0;
    }
  }

  function addWin() {
    const wins = getWins() + 1;
    try {
      localStorage.setItem(`${WINS_PREFIX}${selectedMatch.name}`, String(wins));
    } catch (error) {
      // The battle still works if storage is unavailable.
    }
    winsDisplay.textContent = String(wins);
  }

  function renderTypes(container, pokemon) {
    container.innerHTML = pokemon.types
      .map((entry) => `<span class="type-pill battle-type type-${entry.type.name}">${entry.type.name}</span>`)
      .join('');
  }

  function artworkFor(pokemon, fallback = '') {
    return pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default || fallback;
  }

  function statFor(pokemon, statName) {
    return pokemon.stats.find((entry) => entry.stat.name === statName)?.base_stat || 50;
  }

  function renderHp(side) {
    const isPlayer = side === 'player';
    const hp = isPlayer ? playerHp : enemyHp;
    const maxHp = isPlayer ? playerMaxHp : enemyMaxHp;
    const text = isPlayer ? playerHpText : enemyHpText;
    const bar = isPlayer ? playerHpBar : enemyHpBar;
    const percent = maxHp ? Math.max(0, (hp / maxHp) * 100) : 0;

    text.textContent = `${Math.max(0, hp)} / ${maxHp}`;
    bar.style.width = `${percent}%`;
    bar.classList.toggle('low', percent <= 30);
  }

  function resetArena() {
    battleActive = false;
    turnInProgress = false;
    player = null;
    enemy = null;
    playerMoves = [];
    enemyMoves = [];
    moveButtons.hidden = true;
    moveButtons.innerHTML = '';
    startButton.hidden = false;
    startButton.disabled = false;
    startButton.textContent = 'Find Opponent';
    playerName.textContent = selectedMatch?.name || 'Your Pokémon';
    playerTypes.innerHTML = '';
    playerHpText.textContent = '-- / --';
    playerHpBar.style.width = '0%';
    playerSprite.src = selectedMatch?.artwork || '';
    playerSprite.alt = selectedMatch ? selectedMatch.name : '';
    enemyName.textContent = 'Wild opponent';
    enemyTypes.innerHTML = '';
    enemyHpText.textContent = '-- / --';
    enemyHpBar.style.width = '0%';
    enemySprite.removeAttribute('src');
    enemySprite.alt = '';
  }

  function selectMatch(pokemon, button) {
    selectedMatch = pokemon;
    roster.querySelectorAll('.roster-pokemon').forEach((item) => {
      item.classList.toggle('selected', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    winsDisplay.textContent = String(getWins());
    resetArena();
    message.textContent = `${pokemon.name} is ready. Find a wild opponent!`;
  }

  function renderRoster() {
    roster.innerHTML = '';
    matches.forEach((pokemon, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'roster-pokemon';
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = `<img src="${pokemon.artwork}" alt="" /><span>${pokemon.name}</span>`;
      button.addEventListener('click', () => selectMatch(pokemon, button));
      roster.appendChild(button);
      if (index === 0) selectMatch(pokemon, button);
    });
  }

  async function loadMoves(pokemon, limit = 4) {
    const candidates = pokemon.moves.slice(0, 16);
    const results = await Promise.allSettled(candidates.map((entry) => fetchJson(entry.move.url)));
    const damagingMoves = results
      .filter((result) => result.status === 'fulfilled' && result.value.power && result.value.damage_class.name !== 'status')
      .map((result) => result.value)
      .sort((a, b) => {
        const aStab = pokemon.types.some((entry) => entry.type.name === a.type.name) ? 1 : 0;
        const bStab = pokemon.types.some((entry) => entry.type.name === b.type.name) ? 1 : 0;
        return bStab - aStab || a.power - b.power;
      });

    if (!damagingMoves.length) {
      return [{ name: 'tackle', power: 45, accuracy: 100, type: pokemon.types[0].type, damage_class: { name: 'physical' } }];
    }

    return damagingMoves.slice(0, limit);
  }

  function renderFighters() {
    playerName.textContent = titleCase(player.name);
    enemyName.textContent = `Wild ${titleCase(enemy.name)}`;
    renderTypes(playerTypes, player);
    renderTypes(enemyTypes, enemy);
    playerSprite.src = artworkFor(player, selectedMatch.artwork);
    playerSprite.alt = titleCase(player.name);
    enemySprite.src = artworkFor(enemy);
    enemySprite.alt = titleCase(enemy.name);
    renderHp('player');
    renderHp('enemy');
  }

  function effectiveness(moveType, defender) {
    return defender.types.reduce((multiplier, entry) => {
      return multiplier * (TYPE_CHART[moveType]?.[entry.type.name] ?? 1);
    }, 1);
  }

  function calculateDamage(attacker, defender, move) {
    const category = move.damage_class.name;
    const attackStat = statFor(attacker, category === 'special' ? 'special-attack' : 'attack');
    const defenseStat = statFor(defender, category === 'special' ? 'special-defense' : 'defense');
    const stab = attacker.types.some((entry) => entry.type.name === move.type.name) ? 1.5 : 1;
    const typeMultiplier = effectiveness(move.type.name, defender);
    const random = 0.9 + Math.random() * 0.2;
    const base = (((16 * move.power * attackStat) / Math.max(1, defenseStat)) / 50) + 2;
    return {
      amount: typeMultiplier === 0 ? 0 : Math.max(1, Math.round(base * stab * typeMultiplier * random)),
      typeMultiplier
    };
  }

  function effectivenessText(multiplier) {
    if (multiplier === 0) return " It had no effect!";
    if (multiplier > 1) return " It's super effective!";
    if (multiplier < 1) return " It's not very effective.";
    return '';
  }

  function animateFighter(side, action) {
    const sprite = side === 'player' ? playerSprite : enemySprite;
    sprite.classList.remove('attack', 'hit');
    void sprite.offsetWidth;
    sprite.classList.add(action);
  }

  function setMoveButtonsDisabled(disabled) {
    moveButtons.querySelectorAll('button').forEach((button) => { button.disabled = disabled; });
  }

  function setRosterDisabled(disabled) {
    roster.querySelectorAll('button').forEach((button) => { button.disabled = disabled; });
  }

  function finishBattle(playerWon) {
    battleActive = false;
    turnInProgress = false;
    moveButtons.hidden = true;
    startButton.hidden = false;
    startButton.disabled = false;
    startButton.textContent = 'New Opponent';
    setRosterDisabled(false);

    if (playerWon) {
      addWin();
      message.textContent = `${titleCase(player.name)} wins! Type strategy paid off.`;
    } else {
      message.textContent = `${titleCase(player.name)} fainted. Choose a new opponent and try another move strategy.`;
    }
  }

  async function useMove(move) {
    if (!battleActive || turnInProgress) return;
    turnInProgress = true;
    setMoveButtonsDisabled(true);

    const playerHit = calculateDamage(player, enemy, move);
    enemyHp = Math.max(0, enemyHp - playerHit.amount);
    animateFighter('player', 'attack');
    animateFighter('enemy', 'hit');
    renderHp('enemy');
    message.textContent = `${titleCase(player.name)} used ${titleCase(move.name)} for ${playerHit.amount} damage.${effectivenessText(playerHit.typeMultiplier)}`;

    await new Promise((resolve) => window.setTimeout(resolve, 750));
    if (enemyHp <= 0) {
      finishBattle(true);
      return;
    }

    const enemyMove = enemyMoves[Math.floor(Math.random() * enemyMoves.length)];
    const enemyHit = calculateDamage(enemy, player, enemyMove);
    playerHp = Math.max(0, playerHp - enemyHit.amount);
    animateFighter('enemy', 'attack');
    animateFighter('player', 'hit');
    renderHp('player');
    message.textContent = `Wild ${titleCase(enemy.name)} used ${titleCase(enemyMove.name)} for ${enemyHit.amount} damage.${effectivenessText(enemyHit.typeMultiplier)}`;

    await new Promise((resolve) => window.setTimeout(resolve, 650));
    if (playerHp <= 0) {
      finishBattle(false);
      return;
    }

    turnInProgress = false;
    setMoveButtonsDisabled(false);
  }

  function renderMoves() {
    moveButtons.innerHTML = '';
    playerMoves.forEach((move) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `move-btn type-${move.type.name}`;
      button.innerHTML = `<strong>${titleCase(move.name)}</strong><span>${titleCase(move.type.name)} · Power ${move.power}</span>`;
      button.addEventListener('click', () => useMove(move));
      moveButtons.appendChild(button);
    });
    moveButtons.hidden = false;
  }

  async function startBattle() {
    if (!selectedMatch) return;
    startButton.disabled = true;
    startButton.textContent = 'Loading Battle...';
    setRosterDisabled(true);
    message.textContent = 'Loading live stats, types, and moves from PokéAPI...';

    try {
      player = await fetchJson(`${API_BASE}/pokemon/${pokemonSlug(selectedMatch.name)}`);
      let enemyId = Math.floor(Math.random() * 151) + 1;
      if (enemyId === player.id) enemyId = (enemyId % 151) + 1;
      enemy = await fetchJson(`${API_BASE}/pokemon/${enemyId}`);
      [playerMoves, enemyMoves] = await Promise.all([loadMoves(player, 4), loadMoves(enemy, 3)]);

      playerMaxHp = statFor(player, 'hp') * 2 + 60;
      enemyMaxHp = statFor(enemy, 'hp') * 2 + 60;
      playerHp = playerMaxHp;
      enemyHp = enemyMaxHp;
      battleActive = true;
      turnInProgress = false;
      renderFighters();
      renderMoves();
      startButton.hidden = true;
      startButton.disabled = false;
      message.textContent = `A wild ${titleCase(enemy.name)} appeared! Choose a move.`;
    } catch (error) {
      resetArena();
      setRosterDisabled(false);
      message.textContent = 'The battle data could not be loaded. Check your connection and try again.';
    }
  }

  startButton.addEventListener('click', startBattle);

  window.addEventListener('pokemonmatchesready', (event) => {
    matches = event.detail.results;
    game.classList.remove('is-hidden');
    renderRoster();
  });

  window.addEventListener('pokemonmatchesreset', () => {
    battleActive = false;
    turnInProgress = false;
    game.classList.add('is-hidden');
  });
})();
