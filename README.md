# Pokémon Face Match

A small web app that accepts a selfie, sends the image to a backend route, and returns the 5 Pokémon that best match the user's facial vibe.

## Tech stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Pokémon metadata: PokéAPI
- Image analysis: OpenAI Vision API (server-side only)

## How to run locally
```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

## Notes
- The OpenAI API key must be kept in the server environment and should never be committed to the repository.
- If the key is not configured, the app falls back to a demo result set so the UI can still be tested.
