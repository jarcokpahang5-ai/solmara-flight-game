// Entry point for Solmara Skies.
// Wires the canvas, the controls and the game together, runs the
// frame loop, and honours the ?shot= query used for screenshots:
// start, play, runway and end each stage a fixed, seeded scene so a
// screenshot run is the same flight every time.

import { COURSE, VIEW } from './config.js';
import { SkyGame, PHASES } from './game.js';
import { FlightControls } from './input.js';

const canvas = document.getElementById('flight-canvas');
const game = new SkyGame(canvas);
const controls = new FlightControls(canvas);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number(params.get('seed'));
if (Number.isFinite(seedParam) && seedParam > 0) {
  game.seed = seedParam;
  game.resetRun();
}

function stageShotScene() {
  if (!shot) return;
  const state = game.state;
  if (shot === 'start') {
    state.phase = PHASES.START;
  } else if (shot === 'cover') {
    // Early flight over the sea with the coastline and the first
    // ring ahead: the cover shows the plane, the terrain and the HUD.
    state.phase = PHASES.FLYING;
    game.plane.y = 2100;
    game.plane.x = 0;
    game.plane.altitude = 520;
    game.plane.speed = 205;
    game.plane.heading = 0;
    state.score = 0;
    state.ringsPassed = 0;
    state.fuel = 100;
    state.timeLeft = 295;
  } else if (shot === 'play') {
    state.phase = PHASES.FLYING;
    game.plane.y = 5800;
    game.plane.x = -40;
    game.plane.altitude = 560;
    game.plane.speed = 210;
    game.plane.heading = -8;
    state.score = 350;
    state.ringsPassed = 3;
    state.fuel = 78;
    state.timeLeft = 212;
    // Mark the first three rings as flown so the scene reads mid-flight.
    game.world.rings.slice(0, 3).forEach((ring) => {
      ring.passed = true;
    });
    game.world.stars[0].taken = true;
  } else if (shot === 'runway') {
    // Final approach: the runway strip runs from just below the HUD
    // down past the plane, every ring flown, fuel low, time short.
    state.phase = PHASES.FLYING;
    game.plane.y = 12900;
    game.plane.x = 0;
    game.plane.altitude = 420;
    game.plane.speed = 195;
    game.plane.heading = 0;
    state.score = 1500;
    state.ringsPassed = 17;
    state.starsTaken = 4;
    state.fuel = 41;
    state.timeLeft = 64;
    game.world.rings.forEach((ring) => {
      ring.passed = true;
    });
  } else if (shot === 'end') {
    state.phase = PHASES.OVER;
    state.score = 890;
    state.ringsPassed = 9;
    state.fuel = 12;
    state.lives = 0;
    state.endReason = 'Struck a radio tower over the city.';
    game.plane.y = 6200;
    game.plane.altitude = 480;
  }
  game.render();
}

function handleKey(code) {
  const phase = game.state.phase;
  if (code === 'Enter' || code === 'Space') {
    if (phase === PHASES.START || phase === PHASES.WON || phase === PHASES.OVER) {
      game.startFlight();
    } else if (phase === PHASES.PAUSED) {
      game.togglePause();
    }
  }
  if (code === 'KeyP' || code === 'Escape') game.togglePause();
  if (code === 'KeyM') game.sounds.enabled = !game.sounds.enabled;
}

canvas.addEventListener('click', () => {
  game.sounds.unlock();
  if (game.state.phase === PHASES.START) game.startFlight();
});

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  for (const code of controls.pressed) handleKey(code);
  controls.consumePressed();
  game.update(dt, controls);
  game.render();
  requestAnimationFrame(frame);
}

stageShotScene();
if (!shot) {
  // A staged shot is one frozen frame: the loop would keep flying
  // the plane, so a screenshot must never start it.
  requestAnimationFrame(frame);
}

// A small read-only handle for play-testing: the page never shows it,
// but an automated test can read the flight's state through it.
window.__solmara = {
  game,
  state() {
    return {
      phase: game.state.phase,
      score: game.state.score,
      lives: game.state.lives,
      fuel: Math.round(game.state.fuel),
      altitude: Math.round(game.plane.altitude),
      speed: Math.round(game.plane.speed),
      heading: Math.round(game.plane.heading),
      x: Math.round(game.plane.x),
      y: Math.round(game.plane.y),
      ringsPassed: game.state.ringsPassed,
      ringsTotal: game.state.ringsTotal,
      timeLeft: Math.round(game.state.timeLeft),
      endReason: game.state.endReason,
    };
  },
};

void VIEW;
