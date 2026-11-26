// Game state for Solmara Skies: the flight loop's brain.
// It owns the phase (start, flying, paused, won, over), the score,
// the fuel, the lives and the clock, and it asks the aircraft, the
// world and the renderer to do the rest.

import { COURSE, PLANE, SCORING } from './config.js';
import { Aircraft } from './aircraft.js';
import { buildWorld, groundElevationAt, legAt } from './world.js';
import { SoundBank } from './audio.js';
import {
  drawAircraft,
  drawBalloons,
  drawCity,
  drawClouds,
  drawFields,
  drawGround,
  drawMountains,
  drawParticles,
  drawRings,
  drawSky,
  drawStars,
  drawTowers,
} from './render.js';
import {
  drawGameOverScreen,
  drawHud,
  drawPauseScreen,
  drawStartScreen,
  drawToast,
  drawWinScreen,
} from './hud.js';

export const PHASES = {
  START: 'start',
  FLYING: 'flying',
  PAUSED: 'paused',
  WON: 'won',
  OVER: 'over',
};

export class SkyGame {
  constructor(canvas, seed = 20261126) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.seed = seed;
    this.world = buildWorld(seed);
    this.plane = new Aircraft();
    this.sounds = new SoundBank();
    this.particles = [];
    this.toast = null;
    this.time = 0;
    this.resetRun();
  }

  resetRun() {
    this.world = buildWorld(this.seed);
    this.plane.reset();
    this.state = {
      phase: PHASES.START,
      score: 0,
      fuel: 100,
      lives: 3,
      timeLeft: COURSE.timeLimitSeconds,
      ringsPassed: 0,
      ringsTotal: this.world.rings.length,
      starsTaken: 0,
      nearMisses: 0,
      streak: 0,
      landingBonus: 0,
      endReason: '',
      invulnerableUntil: 0,
      round: 1,
    };
    this.particles = [];
    this.toast = null;
  }

  startFlight() {
    this.resetRun();
    this.state.phase = PHASES.FLYING;
    this.sounds.unlock();
    this.showToast('TAKE OFF — FOLLOW THE RINGS');
  }

  togglePause() {
    if (this.state.phase === PHASES.FLYING) this.state.phase = PHASES.PAUSED;
    else if (this.state.phase === PHASES.PAUSED) this.state.phase = PHASES.FLYING;
  }

  showToast(text) {
    this.toast = { text, life: 2.2 };
  }

  burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.4 + Math.random() * 0.6);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 0.7,
        maxLife: 0.7,
        size: 3 + Math.random() * 4,
        color,
        text: null,
      });
    }
  }

  popText(x, y, text, color) {
    this.particles.push({ x, y, vx: 0, vy: -46, life: 1.1, maxLife: 1.1, size: 0, color, text });
  }

  currentObjective() {
    const state = this.state;
    if (state.ringsPassed < 6) return `Pass ${6 - state.ringsPassed} more rings — the city towers are ahead`;
    if (state.starsTaken < 4) return `Collect ${4 - state.starsTaken} more fuel stars before the pass`;
    if (state.ringsPassed < state.ringsTotal) return `Pass the last ${state.ringsTotal - state.ringsPassed} rings, then land`;
    return 'All rings flown — bring her home to the runway';
  }

  legName() {
    return legAt(this.plane.y).name;
  }

  update(dt, controls) {
    this.time += dt;
    if (this.toast) {
      this.toast.life -= dt;
      if (this.toast.life <= 0) this.toast = null;
    }
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);

    if (this.state.phase !== PHASES.FLYING) return;

    const state = this.state;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      this.endFlight('Out of time — the clock hit zero before the runway.');
      return;
    }

    this.plane.update(dt, controls);

    // Fuel: cruise burn, heavier on boost, nothing when the tank is dry.
    const burn = this.plane.boosting ? PLANE.boostFuelBurn : PLANE.cruiseFuelBurn;
    state.fuel = Math.max(0, state.fuel - burn * dt);
    if (state.fuel <= 0 && !this.plane.engineOut) {
      this.plane.engineOut = true;
      this.showToast('FUEL EMPTY — GLIDING, FIND THE RUNWAY');
    }

    this.checkRings();
    this.checkStars();
    this.checkHazards();
    this.checkLanding();

    // The round counter follows the leg the plane is flying through.
    const legIndex = ['Coast', 'Farmland', 'City', 'High Pass', 'Valley Run'].indexOf(this.legName());
    state.round = Math.max(1, legIndex + 1);
  }

  checkRings() {
    const state = this.state;
    const plane = this.plane;
    for (const ring of this.world.rings) {
      if (ring.passed || ring.missed) continue;
      const along = plane.y - ring.y;
      if (along < -40) continue;
      if (along > 60) {
        ring.missed = true;
        state.streak = 0;
        continue;
      }
      const lateral = Math.abs(plane.x - ring.x);
      const vertical = Math.abs(plane.altitude - ring.altitude);
      if (lateral < ring.radius && vertical < 130) {
        ring.passed = true;
        state.ringsPassed += 1;
        state.streak += 1;
        const bonus = state.streak >= 3 ? SCORING.ringStreakBonus : 0;
        state.score += SCORING.ring + bonus;
        this.sounds.ring();
        this.popText(VIEW_PLANE_X, 330, `RING +${SCORING.ring + bonus}`, '#ffd94d');
        if (state.ringsPassed === 6) this.showToast('CITY LEG OPEN — WATCH THE TOWERS');
        if (state.ringsPassed === state.ringsTotal) this.showToast('ALL RINGS FLOWN — LAND HER NOW');
      }
    }
  }

  checkStars() {
    const state = this.state;
    const plane = this.plane;
    for (const star of this.world.stars) {
      if (star.taken) continue;
      if (Math.abs(plane.y - star.y) > 55) continue;
      if (Math.abs(plane.x - star.x) > 70) continue;
      if (Math.abs(plane.altitude - star.altitude) > 150) continue;
      star.taken = true;
      state.starsTaken += 1;
      state.score += SCORING.star;
      state.fuel = Math.min(100, state.fuel + 25);
      this.plane.engineOut = false;
      this.sounds.star();
      this.popText(VIEW_PLANE_X, 360, `FUEL +25  •  +${SCORING.star}`, '#7dff9a');
    }
  }

  checkHazards() {
    const state = this.state;
    const plane = this.plane;
    if (this.time < state.invulnerableUntil) return;

    // Mountains: the ground itself rises into the flight path.
    const ground = groundElevationAt(this.world, plane.x, plane.y);
    if (plane.altitude < ground + 30) {
      this.takeHit(`Clipped a mountain at ${Math.round(ground)} ft.`);
      return;
    }

    // Towers are thin but tall; balloons drift at their own altitude.
    for (const tower of this.world.towers) {
      if (Math.abs(plane.y - tower.y) > 30) continue;
      if (Math.abs(plane.x - tower.x) > 34) continue;
      if (plane.altitude < tower.height) {
        this.takeHit('Struck a radio tower.');
        return;
      }
    }
    for (const balloon of this.world.balloons) {
      if (Math.abs(plane.y - balloon.y) > 40) continue;
      if (Math.abs(plane.x - balloon.x) > 44) continue;
      if (Math.abs(plane.altitude - balloon.altitude) > 90) continue;
      this.takeHit('Hit a hot-air balloon.');
      return;
    }

    // Near miss: close enough to feel, far enough to count.
    for (const tower of this.world.towers) {
      if (Math.abs(plane.y - tower.y) > 34) continue;
      const gap = Math.abs(plane.x - tower.x);
      if (gap > 34 && gap < 90 && plane.altitude < tower.height) {
        state.nearMisses += 1;
        state.score += SCORING.nearMiss;
        this.popText(VIEW_PLANE_X, 300, `NEAR MISS +${SCORING.nearMiss}`, '#eaf6ff');
        tower.counted = true;
        break;
      }
    }
  }

  takeHit(reason) {
    const state = this.state;
    state.lives -= 1;
    state.streak = 0;
    this.sounds.thud();
    const pos = this.plane.screenPosition();
    this.burst(pos.x, pos.y, '#ff5a4e', 26, 260);
    this.burst(pos.x, pos.y, '#ffd94d', 14, 180);
    if (state.lives <= 0) {
      this.endFlight(reason);
      return;
    }
    this.showToast(`${reason}  —  ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left`);
    state.invulnerableUntil = this.time + 2.5;
    this.plane.altitude = Math.max(this.plane.altitude, 650);
    this.plane.speed = Math.max(this.plane.speed, 170);
  }

  checkLanding() {
    const state = this.state;
    const plane = this.plane;
    if (plane.y < COURSE.runwayStart) return;
    const aligned = Math.abs(plane.x) < COURSE.runwayHalfWidth;
    const slowEnough = plane.speed < 235;
    const lowEnough = plane.altitude < 150;
    if (plane.y > COURSE.runwayEnd) {
      this.endFlight('Overshot the runway — the course ends past the threshold.');
      return;
    }
    if (aligned && slowEnough && lowEnough) {
      const timeBonus = Math.round(state.timeLeft) * SCORING.timeBonusPerSecond;
      const fuelBonus = Math.round(state.fuel) * SCORING.fuelBonusPerPoint;
      state.landingBonus = SCORING.landingBase + timeBonus + fuelBonus;
      state.score += state.landingBonus;
      state.phase = PHASES.WON;
      this.sounds.win();
    } else if (plane.altitude < 60 && !aligned) {
      this.endFlight('Touched down beside the runway.');
    }
  }

  endFlight(reason) {
    this.state.endReason = reason;
    this.state.phase = PHASES.OVER;
    this.sounds.lose();
  }

  render() {
    const ctx = this.ctx;
    const plane = this.plane;
    drawSky(ctx, this.time);
    drawGround(ctx, plane);
    drawFields(ctx, this.world, plane);
    drawCity(ctx, this.world, plane);
    drawMountains(ctx, this.world, plane);
    drawTowers(ctx, this.world, plane);
    drawBalloons(ctx, this.world, plane, this.time);
    drawRings(ctx, this.world, plane, this.time);
    drawStars(ctx, this.world, plane, this.time);
    drawClouds(ctx, this.world, plane, this.time);
    const invulnerable = this.time < this.state.invulnerableUntil;
    if (this.state.phase !== PHASES.START) {
      drawAircraft(ctx, plane, this.time, invulnerable);
    }
    drawParticles(ctx, this.particles);

    if (this.state.phase === PHASES.FLYING || this.state.phase === PHASES.PAUSED) {
      drawHud(ctx, this);
    }
    if (this.state.phase === PHASES.FLYING) drawToast(ctx, this.toast);
    if (this.state.phase === PHASES.START) drawStartScreen(ctx, this);
    if (this.state.phase === PHASES.PAUSED) drawPauseScreen(ctx);
    if (this.state.phase === PHASES.OVER) drawGameOverScreen(ctx, this);
    if (this.state.phase === PHASES.WON) drawWinScreen(ctx, this);
  }
}

const VIEW_PLANE_X = 640;
