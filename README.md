# software-dev-sim-web

**StrategyKit** — a visual strategy studio for the
[`@gavmor/software-dev-sim`](https://github.com/gavmor/software-dev-sim) game
engine. Build a prioritized rule stack ("if coverage < 75% → write tests"),
run a deterministic 100-day simulation against the real engine, and watch the
day-by-day story unfold.

Live: <https://gavmor.github.io/software-dev-sim-web/>

## Stack

Preact + TypeScript + Vite + pnpm, Remeda for data transforms, Tailwind CSS v4
for styling. The simulation drives the published engine package — no game
logic is duplicated in this repo.

## Developing

The engine package lives on GitHub Packages, so installs need a token with
`read:packages`:

```sh
# one-time: point pnpm at your token (never commit it)
export NODE_AUTH_TOKEN=ghp_your_token_with_read_packages
pnpm install
pnpm dev
```

Other commands:

```sh
pnpm build    # tsc --noEmit && vite build
pnpm preview  # serve the production build locally
```

## Deploying

Pushing to `main` runs the *Deploy to GitHub Pages* workflow: install (via
`GITHUB_TOKEN`), typecheck, build, and publish `dist/` to GitHub Pages. No
manual steps.
