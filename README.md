# **Pokémon Face Match**

A small web app that accepts a selfie, sends the image to a backend route, and returns the 5 Pokémon that best match the user's facial vibe.

## Tech stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Pokémon metadata: PokéAPI
- Image analysis: OpenAI Vision API (server-side only)

## Features
- Live PokéAPI browser rendered with JavaScript
- Pokémon name search and type filtering
- 12-item pagination with previous/next controls
- Detail dialog with descriptions, converted height/weight, and animated stat bars
- Live six-stat hexagon radar charts on every match card
- Turn-based Type Battle using a matched Pokémon and live PokéAPI stats/moves
- Type effectiveness, animated HP bars, random opponents, and per-Pokémon wins in `localStorage`
- Loading, empty, and retryable error states
- Favorites saved with `localStorage`
- Responsive layouts for desktop, tablet, and mobile

## How to run locally
```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

## GitHub Pages
The repository includes a GitHub Actions workflow at `.github/workflows/pages.yml`. It publishes only the five static website files whenever the `main` branch is pushed.

1. Push the project to a GitHub repository using the `main` branch.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Open the **Actions** tab and wait for “Deploy Pokémon Generator to GitHub Pages” to finish.

The live Pokédex, camera, stat charts, favorites, and Type Battle work directly on GitHub Pages. Since Pages cannot run the private Express/OpenAI route, the photo matcher automatically uses its demo match set there. Deploy to Vercel instead if you need real server-side image analysis in production.

## Notes
- The OpenAI API key must be kept in the server environment and should never be committed to the repository.
- If the key is not configured, the app falls back to a demo result set so the UI can still be tested.
