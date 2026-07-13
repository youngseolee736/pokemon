import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const fallbackPokemon = [
  {
    name: 'Pikachu',
    type: 'Electric',
    vibe: 'Playful',
    artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    similarity: 93,
    reason: 'Bright eyes and an energetic expression feel similar to Pikachu’s lively, expressive look.'
  },
  {
    name: 'Charmander',
    type: 'Fire',
    vibe: 'Bold',
    artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',
    similarity: 86,
    reason: 'A sharp facial outline and strong expression match Charmander’s bold personality.'
  },
  {
    name: 'Bulbasaur',
    type: 'Grass, Poison',
    vibe: 'Calm',
    artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
    similarity: 78,
    reason: 'Soft contours and a calm face suggest a gentle Bulbasaur-like vibe.'
  },
  {
    name: 'Charizard',
    type: 'Fire, Flying',
    vibe: 'Powerful',
    artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
    similarity: 73,
    reason: 'A strong jaw and confident expression align with Charizard’s powerful silhouette.'
  },
  {
    name: 'Pidgey',
    type: 'Flying',
    vibe: 'Light',
    artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/16.png',
    similarity: 71,
    reason: 'A light and quick-looking face shape fits the approachable feel of Pidgey.'
  }
];

async function getPokemonCandidates() {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=12');
  const json = await response.json();
  const names = json.results.map((item) => item.name);

  const detailCalls = names.map(async (name) => {
    const detailResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    const detail = await detailResponse.json();

    return {
      name: name,
      type: detail.types.map((item) => item.type.name).join(', '),
      artwork: detail.sprites.other['official-artwork'].front_default,
      similarity: 0,
      reason: ''
    };
  });

  return Promise.all(detailCalls);
}

function buildFallbackResults(candidates) {
  return candidates.slice(0, 5).map((pokemon, index) => ({
    ...pokemon,
    similarity: 90 - index * 4,
    vibe: fallbackPokemon[index].vibe,
    reason: fallbackPokemon[index].reason,
    name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)
  }));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Pokemon Face Match backend is alive.' });
});

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a selfie image first.' });
  }

  try {
    const candidates = await getPokemonCandidates();

    if (!process.env.OPENAI_API_KEY) {
      return res.json({ results: buildFallbackResults(candidates) });
    }

    const imageBase64 = req.file.buffer.toString('base64');
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are comparing a human face photo to Pokémon faces. Return strict JSON only. Field names: results: array of exactly 5 objects with name, type, artwork, similarity, vibe, reason. similarity must be a number from 0-100. vibe must be a short descriptive word such as Playful, Calm, Bold, Powerful, Light, or Mystic.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Compare this face photo to these Pokémon candidates: ${candidates
                  .slice(0, 8)
                  .map((pokemon) => `${pokemon.name} (${pokemon.type})`)
                  .join(', ')}. Return the top 5 most similar Pokémon. Keep the reasons short and human-readable.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!openAiResponse.ok) {
      throw new Error('OpenAI request failed');
    }

    const openAiJson = await openAiResponse.json();
    const content = openAiJson.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    res.json({ results: parsed.results ?? buildFallbackResults(candidates) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong while analyzing the image.' });
  }
});

app.listen(port, () => {
  console.log(`Pokemon Face Match server is running at http://localhost:${port}`);
});
