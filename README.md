# The Velvet Vault

A top-down museum heist game, drawn entirely in code. You are Wren, a thief
crossing the Marlowe Gallery past patrolling guards and sweeping security
cameras to steal the Star of Marlowe diamond — then slipping out through the
skylight before the alarm hits 100%.

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/nocteaquilaeking/makefun-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/nocteaquilaeking/makefun-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Three galleries, several routes through each. Guards patrol with vision cones
that turn from gold to red as suspicion grows, and they radio each other when
one spots you — a shout pulls nearby patrols toward your last-seen spot.
Cameras sweep the vault and raise the alarm faster than any guard. Smoke
pellets, tossed coins and an EMP burst — each in short supply — are the tools
that buy a way through. A chase always opens with a SPOTTED! grace window, so
getting caught is fair. The alarm runs in stages (CALM, WARY, LOCKDOWN) and
every patrol walks faster as it climbs. Loot comes in tiers — paintings and
gold, gem cases, the Star itself — and the getaway scores the whole night:
loot, plus a bonus for a fast night, minus an alarm penalty.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — WASD to move, Shift to sneak, E to grab
loot, 1/2/3 to pick a tool, Space to use it, click a guard or camera to mark
its patrol.

---

<sub>Entered on [make.fun](https://make.fun/bounty/best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
