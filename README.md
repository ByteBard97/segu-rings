# segu-rings

A design and educational website about cyclic quantities, ring mathematics, and the [`segu`](./segu) JavaScript library.

- **[Read the essay](https://bytebard97.github.io/segu-rings/essay/essay.html)** — *Your angles are lying to you*
- **[Try the demos](https://bytebard97.github.io/segu-rings/playground/loop-time-is-a-ring.html)** — interactive playground
- **[The ring patch](https://bytebard97.github.io/segu-rings/playground/segu-ring-patch.html)** — how to make `segu` ring-capable

## Project structure

| Directory | Purpose |
|-----------|---------|
| `app/` | Vite + Vue 3 source (builds into `docs/`) |
| `docs/` | Static build output, served by GitHub Pages |
| `segu/` | The `segu` JavaScript library (git submodule) |

## Local development

```bash
cd app
npm install
npm run dev      # Vite dev server
cd ../docs
python3 -m http.server 8080   # or any static server
```

## Deploy

Pushes to `main` trigger the [GitHub Actions workflow](.github/workflows/deploy.yml) which builds and deploys to GitHub Pages automatically.
