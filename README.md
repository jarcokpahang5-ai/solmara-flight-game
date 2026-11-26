# Solmara Skies

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/jarcokpahang5-ai/solmara-flight-game/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/jarcokpahang5-ai/solmara-flight-game/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

Solmara Skies is a complete 2D flight game: take off over the coast of Solmara, thread 17 gold rings through farmland, a lit-up city and a snowy mountain pass, dodge towers and hot-air balloons, collect fuel stars, and land on the runway before the fuel or the clock runs out.

## How to play

Fly the course from the coast to Solmara International. Steer with the
arrow keys or WASD (or move the mouse), climb and descend with up/down,
and hold Shift or click for boost. Fly through the gold rings at the
altitude printed above them, grab fuel stars to keep the tank full, and
mind the mountains: the ground rises into your flight path in the High
Pass. Land on the runway — aligned, slow and low — for the landing
bonus. Three lives, 300 seconds, one runway.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The game is plain static files under
`game/` and plays offline in a desktop browser with no network request.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` there.

---

<sub>Entered on [make.fun](https://make.fun/?ref=yv60esak&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
