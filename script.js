const pokemonPool = [
  {
    name: "Pikachu",
    type: "Electric Type",
    region: "Kanto",
    rarity: "⭐",
    glyph: "⚡",
    description: "A Pokémon with quick reflexes and bright energy.",
    hp: 72,
    attack: 68,
    defense: 55,
    speed: 88,
    color: "#f7cf45",
  },
  {
    name: "Charmander",
    type: "Fire Type",
    region: "Kanto",
    rarity: "⭐⭐",
    glyph: "🔥",
    description: "A fire Pokémon known for its explosive energy.",
    hp: 58,
    attack: 82,
    defense: 54,
    speed: 74,
    color: "#ff7542",
  },
  {
    name: "Bulbasaur",
    type: "Grass Type",
    region: "Kanto",
    rarity: "⭐⭐",
    glyph: "🌿",
    description: "A calm Pokémon that builds plant energy over time.",
    hp: 72,
    attack: 61,
    defense: 63,
    speed: 58,
    color: "#54c17f",
  },
  {
    name: "Charizard",
    type: "Fire Type",
    region: "Kalos",
    rarity: "⭐⭐⭐",
    glyph: "🐉",
    description: "A powerful Pokémon with strong wings and fiery attacks.",
    hp: 78,
    attack: 94,
    defense: 72,
    speed: 81,
    color: "#ff6d47",
  },
  {
    name: "Mewtwo",
    type: "Psychic Type",
    region: "Legendary Land",
    rarity: "⭐⭐⭐⭐",
    glyph: "🌀",
    description: "A mysterious Pokémon with near-limitless power.",
    hp: 90,
    attack: 98,
    defense: 88,
    speed: 90,
    color: "#8f76ff",
  },
  {
    name: "Pidgey",
    type: "Flying Type",
    region: "Hoenn",
    rarity: "⭐⭐",
    glyph: "🕊️",
    description: "A swift and agile Pokémon that glides through the sky.",
    hp: 66,
    attack: 70,
    defense: 61,
    speed: 92,
    color: "#7bc7ff",
  },
];

const elements = {
  button: document.querySelector("#generateBtn"),
  card: document.querySelector("#pokemonCard"),
  rarityBadge: document.querySelector("#rarityBadge"),
  regionTag: document.querySelector("#regionTag"),
  glyph: document.querySelector("#pokemonGlyph"),
  name: document.querySelector("#pokemonName"),
  type: document.querySelector("#pokemonType"),
  description: document.querySelector("#pokemonDescription"),
  hp: document.querySelector("#statHp"),
  attack: document.querySelector("#statAttack"),
  defense: document.querySelector("#statDefense"),
  speed: document.querySelector("#statSpeed"),
};

function renderPokemon(pokemon) {
  elements.rarityBadge.textContent = pokemon.rarity;
  elements.regionTag.textContent = pokemon.region;
  elements.glyph.textContent = pokemon.glyph;
  elements.name.textContent = pokemon.name;
  elements.type.textContent = pokemon.type;
  elements.description.textContent = pokemon.description;
  elements.hp.textContent = pokemon.hp;
  elements.attack.textContent = pokemon.attack;
  elements.defense.textContent = pokemon.defense;
  elements.speed.textContent = pokemon.speed;

  elements.card.style.setProperty("--accent", pokemon.color);
}

function pickRandomPokemon() {
  const randomIndex = Math.floor(Math.random() * pokemonPool.length);
  return pokemonPool[randomIndex];
}

function handleGenerate() {
  renderPokemon(pickRandomPokemon());
}

elements.button.addEventListener("click", handleGenerate);
renderPokemon(pickRandomPokemon());
