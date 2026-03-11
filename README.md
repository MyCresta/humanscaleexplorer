# Human Scale Explorer

Human Scale Explorer is an interactive React + Three.js app that compares a person against estimated lifetime amounts of waste, food, water, drinks, household use, and other everyday categories in a 3D scene.

## What It Does

- Lets the user adjust age, gender, and region.
- Shows annual and lifetime estimates for each category.
- Visualizes the selected category next to a human model at comparable scale.
- Links each estimate to a source and exposes a confidence level for the underlying model.

## Local Development

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```

## GitHub Pages

This repo is configured for GitHub Pages deployment through GitHub Actions.

1. Push the repository to GitHub.
2. In GitHub, open `Settings -> Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to `main` to trigger deployment, or run the `Deploy to GitHub Pages` workflow manually.

The Vite build uses a relative asset base, so it works on standard repository Pages URLs without hardcoding the repo path.

## Project Structure

- `src/App.tsx`: app state, selection flow, and derived comparison values
- `src/model.ts`: category data, source metadata, and estimate helpers
- `src/components/`: control panel and 3D scene components
- `src/config/site.ts`: public-facing app name and description

## Notes on Methodology

- Not every category is equally strong. The interface exposes `high`, `medium`, and `low` confidence levels.
- Some categories are based on direct source values, while others are modeled from proxies or derived splits.
- Low-confidence categories are intentionally kept in the app, but they are explicitly marked as exploratory rather than precise.

## Remaining Recommended Cleanup

- Add a `LICENSE` file once you decide the license.
- Add a favicon and share image for richer previews.
- Consider an in-app methodology or about section for assumptions and caveats.
