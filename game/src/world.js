// The world of Solmara Skies: one seeded course from the coast to
// the runway. Every feature has a fixed world position, so the course
// is the same every time a seed is used and the screenshots are stable.

import { COURSE, LEGS } from './config.js';
import { makeRng, range } from './rng.js';

export function legAt(distance) {
  for (const leg of LEGS) {
    if (distance >= leg.from && distance < leg.to) return leg;
  }
  return LEGS[LEGS.length - 1];
}

export function groundKindAt(distance) {
  if (distance >= COURSE.runwayStart) return 'runway';
  return legAt(distance).kind;
}

// Elevation of the ground in feet at a world point. Mountains are the
// only ground that can reach the aircraft; everywhere else the ground
// sits near sea level.
export function groundElevationAt(world, x, y) {
  let elevation = 0;
  for (const peak of world.mountains) {
    const dx = x - peak.x;
    const dy = y - peak.y;
    const dist = Math.hypot(dx, dy);
    if (dist < peak.radius) {
      const falloff = 1 - dist / peak.radius;
      elevation = Math.max(elevation, peak.height * falloff * falloff);
    }
  }
  return elevation;
}

export function buildWorld(seed) {
  const rng = makeRng(seed);
  const world = {
    seed,
    mountains: [],
    towers: [],
    balloons: [],
    rings: [],
    stars: [],
    clouds: [],
    cityBlocks: [],
    fields: [],
  };

  // Rolling farmland patches, drawn as coloured rectangles.
  for (let y = 2400; y < 5400; y += 260) {
    for (let x = -620; x < 620; x += 260) {
      world.fields.push({
        x: x + range(rng, -40, 40),
        y: y + range(rng, -40, 40),
        w: range(rng, 200, 250),
        h: range(rng, 200, 250),
        tone: Math.floor(range(rng, 0, 3)),
      });
    }
  }

  // City blocks: a grid of rooftops with lit windows.
  for (let y = 5500; y < 8200; y += 190) {
    for (let x = -580; x < 580; x += 190) {
      if (Math.abs(x) < 120 && y % 380 < 190) continue; // keep a main avenue clear
      world.cityBlocks.push({
        x: x + range(rng, -24, 24),
        y: y + range(rng, -24, 24),
        w: range(rng, 90, 140),
        h: range(rng, 90, 140),
        lit: rng() < 0.55,
      });
    }
  }

  // Mountains cluster in the High Pass leg, with a few foothills earlier.
  for (let i = 0; i < 26; i += 1) {
    const y = range(rng, 8400, 11100);
    world.mountains.push({
      x: range(rng, -560, 560),
      y,
      radius: range(rng, 170, 320),
      height: range(rng, 480, 980),
      snowy: rng() < 0.6,
    });
  }
  for (let i = 0; i < 5; i += 1) {
    world.mountains.push({
      x: range(rng, -560, 560),
      y: range(rng, 11500, 12600),
      radius: range(rng, 150, 240),
      height: range(rng, 260, 520),
      snowy: false,
    });
  }

  // Radio towers rise from the city and the valley; balloons drift
  // slowly across the farmland and the pass.
  for (let i = 0; i < 10; i += 1) {
    world.towers.push({
      x: range(rng, -520, 520),
      y: range(rng, 5600, 12500),
      height: range(rng, 320, 640),
    });
  }
  for (let i = 0; i < 12; i += 1) {
    world.balloons.push({
      x: range(rng, -480, 480),
      y: range(rng, 2600, 11800),
      altitude: range(rng, 300, 850),
      drift: range(rng, -14, 14),
      hue: Math.floor(range(rng, 0, 4)),
    });
  }

  // Rings: one chain per leg, staggered left and right so the pilot
  // has to steer, each with its own target altitude.
  for (const leg of LEGS) {
    let side = rng() < 0.5 ? -1 : 1;
    for (let i = 0; i < leg.rings; i += 1) {
      const t = (i + 0.5) / leg.rings;
      const y = leg.from + (leg.to - leg.from) * t;
      side = -side;
      world.rings.push({
        x: side * range(rng, 90, 330),
        y,
        altitude: range(rng, 380, 820),
        radius: 95,
        passed: false,
        missed: false,
      });
    }
  }

  // Fuel stars sit between the rings, often off the racing line so
  // collecting them costs a detour.
  for (const leg of LEGS) {
    for (let i = 0; i < leg.stars; i += 1) {
      const t = (i + 0.7) / leg.stars;
      world.stars.push({
        x: range(rng, -420, 420),
        y: leg.from + (leg.to - leg.from) * t,
        altitude: range(rng, 350, 800),
        taken: false,
      });
    }
  }

  // Clouds float above the course and drift with the wind.
  for (let i = 0; i < 42; i += 1) {
    world.clouds.push({
      x: range(rng, -700, 700),
      y: range(rng, -600, COURSE.length),
      size: range(rng, 60, 170),
      speed: range(rng, 6, 18),
    });
  }

  return world;
}
