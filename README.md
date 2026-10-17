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

## Net Worth Race

The 💰 tab pits your current rules against N paired instances of each
preset (default 12): instance *n* of every preset shares a seed, your
company runs the lab seed, and each layer of the stacked streamgraph is one
company's net worth over time. The four stack offsets (zero / normalize /
center / wiggle) are the Observable Plot demo applied to the race.

## Fog of war

Like the original game, bug counts and test quality are hidden until
release (toggle in the run bar, on by default). The invariant is enforced
by interface segregation, not convention: strategies observe the game
exclusively through the engine's `playerView()`, whose `bugs` field is the
last *reported* count — the strategy module (`src/strategy.ts`) never
imports `GameState`, so the live count is unrepresentable there. The sim
driver (`src/sim.ts`) holds the full state and projects the view each day;
`{ xray: true }` is the explicit lab override.

## Deploying

Pushing to `main` runs the *Deploy to GitHub Pages* workflow: install (via
`GITHUB_TOKEN`), typecheck, build, and publish `dist/` to GitHub Pages. No
manual steps.
