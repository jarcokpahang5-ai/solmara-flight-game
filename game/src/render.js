// All canvas drawing for Solmara Skies, except the HUD and the
// screens, which live in hud.js. The camera sits on the aircraft and
// the world scrolls past it: a world point (x, y) lands on screen at
// the plane's screen spot plus its offset from the plane, scaled.

import { COURSE, PALETTE, VIEW } from './config.js';
import { groundElevationAt, groundKindAt } from './world.js';

function worldToScreen(plane, x, y) {
  return {
    x: VIEW.planeScreenX + (x - plane.x) * VIEW.worldScale,
    y: VIEW.planeScreenY - (y - plane.y) * VIEW.worldScale,
  };
}

function onScreen(point, margin) {
  return (
    point.x > -margin &&
    point.x < VIEW.width + margin &&
    point.y > -margin &&
    point.y < VIEW.height + margin
  );
}

export function drawSky(ctx, time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  gradient.addColorStop(0, PALETTE.skyTop);
  gradient.addColorStop(0.45, PALETTE.skyMid);
  gradient.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Sun with a soft halo, high on the right so it never hides the HUD.
  const sunX = 1120;
  const sunY = 92;
  const halo = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 120);
  halo.addColorStop(0, 'rgba(255, 243, 176, 0.95)');
  halo.addColorStop(0.35, 'rgba(255, 217, 77, 0.55)');
  halo.addColorStop(1, 'rgba(255, 217, 77, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sunCore;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
  ctx.fill();
  void time;
}

export function drawClouds(ctx, world, plane, time) {
  ctx.save();
  for (const cloud of world.clouds) {
    const driftedX = cloud.x + Math.sin(time * 0.05 + cloud.y * 0.01) * 20;
    const point = worldToScreen(plane, driftedX, cloud.y + time * cloud.speed * 0.2);
    if (!onScreen(point, 260)) continue;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const s = cloud.size;
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, s, s * 0.38, 0, 0, Math.PI * 2);
    ctx.ellipse(point.x - s * 0.5, point.y + s * 0.1, s * 0.55, s * 0.3, 0, 0, Math.PI * 2);
    ctx.ellipse(point.x + s * 0.5, point.y + s * 0.08, s * 0.6, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// The ground is drawn as horizontal bands: for each screen row, work
// out which world distance it shows and paint that leg's ground.
export function drawGround(ctx, plane) {
  const rowHeight = 8;
  for (let screenY = 0; screenY < VIEW.height; screenY += rowHeight) {
    const worldY = plane.y + (VIEW.planeScreenY - screenY) / VIEW.worldScale;
    const kind = groundKindAt(worldY);
    ctx.fillStyle = groundColor(kind, worldY);
    ctx.fillRect(0, screenY, VIEW.width, rowHeight + 1);
    if (kind === 'sea') drawSeaLines(ctx, screenY, worldY);
    if (kind === 'runway') drawRunwayBand(ctx, screenY, worldY, plane);
  }
  drawCoastline(ctx, plane);
}

function groundColor(kind, worldY) {
  switch (kind) {
    case 'sea':
      return Math.sin(worldY * 0.02) > 0 ? PALETTE.seaDeep : PALETTE.seaShallow;
    case 'fields':
      return Math.sin(worldY * 0.008) > 0.2 ? PALETTE.fieldGreen : PALETTE.fieldGold;
    case 'city':
      return PALETTE.cityGround;
    case 'mountains':
      return '#a89a86';
    case 'valley':
      return PALETTE.grass;
    case 'runway':
      return PALETTE.grass;
    default:
      return PALETTE.fieldGreen;
  }
}

function drawSeaLines(ctx, screenY, worldY) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const phase = (worldY * 0.05) % 90;
  ctx.moveTo(phase, screenY + 4);
  ctx.lineTo(phase + 46, screenY + 4);
  ctx.moveTo(phase + 300, screenY + 4);
  ctx.lineTo(phase + 360, screenY + 4);
  ctx.stroke();
}

// The coastline is a sandy curve where the sea meets the fields.
function drawCoastline(ctx, plane) {
  const top = worldToScreen(plane, 0, 2600);
  const bottom = worldToScreen(plane, 0, 2350);
  if (top.y < -40 || bottom.y > VIEW.height + 40) return;
  ctx.fillStyle = PALETTE.sand;
  ctx.beginPath();
  ctx.moveTo(0, bottom.y);
  for (let x = 0; x <= VIEW.width; x += 40) {
    const worldX = plane.x + (x - VIEW.planeScreenX) / VIEW.worldScale;
    const wave = Math.sin(worldX * 0.004) * 26 + Math.sin(worldX * 0.011) * 10;
    const y = top.y + wave * ((bottom.y - top.y) / 250);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW.width, top.y - 60);
  ctx.lineTo(0, top.y - 60);
  ctx.closePath();
  ctx.fill();
}

function drawRunwayBand(ctx, screenY, worldY, plane) {
  const left = worldToScreen(plane, -COURSE.runwayHalfWidth, worldY);
  const right = worldToScreen(plane, COURSE.runwayHalfWidth, worldY);
  ctx.fillStyle = PALETTE.runway;
  ctx.fillRect(left.x, screenY, right.x - left.x, 9);
  const mid = worldToScreen(plane, 0, worldY);
  if (Math.floor(worldY / 160) % 2 === 0) {
    ctx.fillStyle = PALETTE.runwayMark;
    ctx.fillRect(mid.x - 3, screenY, 6, 9);
  }
  // Threshold bars at the runway's start.
  if (worldY > COURSE.runwayStart && worldY < COURSE.runwayStart + 90) {
    ctx.fillStyle = PALETTE.runwayMark;
    for (let i = -3; i <= 3; i += 1) {
      if (i === 0) continue;
      const bar = worldToScreen(plane, i * 26, worldY);
      ctx.fillRect(bar.x - 7, screenY, 14, 9);
    }
  }
}

export function drawFields(ctx, world, plane) {
  const tones = [PALETTE.fieldGreen, PALETTE.fieldDark, PALETTE.fieldGold];
  for (const field of world.fields) {
    const point = worldToScreen(plane, field.x, field.y);
    if (!onScreen(point, 260)) continue;
    ctx.fillStyle = tones[field.tone];
    ctx.fillRect(point.x - field.w * 0.45, point.y - field.h * 0.45, field.w * 0.9, field.h * 0.9);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(point.x - field.w * 0.45, point.y - field.h * 0.45, field.w * 0.9, field.h * 0.9);
  }
}

export function drawCity(ctx, world, plane) {
  for (const block of world.cityBlocks) {
    const point = worldToScreen(plane, block.x, block.y);
    if (!onScreen(point, 160)) continue;
    ctx.fillStyle = PALETTE.building;
    ctx.fillRect(point.x - block.w * 0.45, point.y - block.h * 0.45, block.w * 0.9, block.h * 0.9);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(point.x - block.w * 0.45, point.y + block.h * 0.2, block.w * 0.9, block.h * 0.25);
    if (block.lit) {
      ctx.fillStyle = PALETTE.buildingLit;
      ctx.fillRect(point.x - block.w * 0.2, point.y - block.h * 0.2, 10, 10);
      ctx.fillRect(point.x + block.w * 0.08, point.y - block.h * 0.05, 10, 10);
    }
  }
}

export function drawMountains(ctx, world, plane) {
  for (const peak of world.mountains) {
    const point = worldToScreen(plane, peak.x, peak.y);
    const radius = peak.radius * VIEW.worldScale;
    if (!onScreen(point, radius + 60)) continue;
    ctx.fillStyle = PALETTE.rock;
    ctx.beginPath();
    ctx.moveTo(point.x - radius, point.y + radius * 0.55);
    ctx.lineTo(point.x, point.y - radius * 0.75);
    ctx.lineTo(point.x + radius, point.y + radius * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.rockDark;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y - radius * 0.75);
    ctx.lineTo(point.x + radius, point.y + radius * 0.55);
    ctx.lineTo(point.x + radius * 0.3, point.y + radius * 0.55);
    ctx.closePath();
    ctx.fill();
    if (peak.snowy) {
      ctx.fillStyle = PALETTE.snow;
      ctx.beginPath();
      ctx.moveTo(point.x - radius * 0.28, point.y - radius * 0.32);
      ctx.lineTo(point.x, point.y - radius * 0.75);
      ctx.lineTo(point.x + radius * 0.28, point.y - radius * 0.32);
      ctx.lineTo(point.x + radius * 0.12, point.y - radius * 0.18);
      ctx.lineTo(point.x - radius * 0.1, point.y - radius * 0.24);
      ctx.closePath();
      ctx.fill();
    }
    // Height label so the pilot can judge the pass at a glance.
    if (radius > 120) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(peak.height)} ft`, point.x, point.y + radius * 0.72);
    }
  }
}

export function drawTowers(ctx, world, plane) {
  for (const tower of world.towers) {
    const point = worldToScreen(plane, tower.x, tower.y);
    if (!onScreen(point, 80)) continue;
    const heightPx = Math.min(120, tower.height * 0.12);
    ctx.strokeStyle = '#3a3f46';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y - heightPx);
    ctx.stroke();
    ctx.strokeStyle = '#3a3f46';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(point.x - 12, point.y);
    ctx.lineTo(point.x, point.y - heightPx);
    ctx.lineTo(point.x + 12, point.y);
    ctx.stroke();
    ctx.fillStyle = PALETTE.danger;
    ctx.beginPath();
    ctx.arc(point.x, point.y - heightPx, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

const BALLOON_COLORS = ['#e84a5f', '#f2a541', '#4a90d9', '#7bc96f'];

export function drawBalloons(ctx, world, plane, time) {
  for (const balloon of world.balloons) {
    const driftedX = balloon.x + Math.sin(time * 0.3 + balloon.y) * 24 + balloon.drift * time * 0.05;
    const point = worldToScreen(plane, driftedX, balloon.y);
    if (!onScreen(point, 90)) continue;
    const bob = Math.sin(time * 1.4 + balloon.y * 0.1) * 5;
    const altDiff = Math.abs(plane.altitude - balloon.altitude);
    const alpha = altDiff < 160 ? 1 : 0.55;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = BALLOON_COLORS[balloon.hue % BALLOON_COLORS.length];
    ctx.beginPath();
    ctx.ellipse(point.x, point.y + bob, 26, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(point.x - 8, point.y + bob - 10, 8, 12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a4632';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(point.x - 12, point.y + bob + 26);
    ctx.lineTo(point.x, point.y + bob + 44);
    ctx.lineTo(point.x + 12, point.y + bob + 26);
    ctx.stroke();
    ctx.fillStyle = '#8a6d3b';
    ctx.fillRect(point.x - 7, point.y + bob + 44, 14, 10);
    ctx.restore();
  }
}

export function drawRings(ctx, world, plane, time) {
  for (const ring of world.rings) {
    const point = worldToScreen(plane, ring.x, ring.y);
    if (!onScreen(point, 180)) continue;
    const distance = Math.abs(plane.y - ring.y);
    const near = distance < 500;
    const pulse = 1 + Math.sin(time * 4 + ring.y * 0.01) * 0.05;
    const radius = ring.radius * VIEW.worldScale * pulse;
    const altDiff = plane.altitude - ring.altitude;
    const verticalOffset = -altDiff * 0.12;
    const cy = point.y + verticalOffset;
    if (ring.passed) {
      ctx.strokeStyle = 'rgba(125, 255, 154, 0.9)';
    } else if (ring.missed) {
      ctx.strokeStyle = 'rgba(160, 160, 160, 0.55)';
    } else {
      ctx.strokeStyle = PALETTE.ring;
    }
    ctx.save();
    ctx.shadowColor = ring.passed ? 'rgba(125,255,154,0.8)' : PALETTE.ringGlow;
    ctx.shadowBlur = near ? 26 : 12;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(point.x, cy, radius, radius * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(point.x, cy, radius, radius * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (!ring.passed && !ring.missed) {
      ctx.fillStyle = '#fff8dd';
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(ring.altitude)} ft`, point.x, cy - radius * 0.62 - 12);
    }
  }
}

export function drawStars(ctx, world, plane, time) {
  for (const star of world.stars) {
    if (star.taken) continue;
    const point = worldToScreen(plane, star.x, star.y);
    if (!onScreen(point, 80)) continue;
    const verticalOffset = -(plane.altitude - star.altitude) * 0.12;
    const cy = point.y + verticalOffset;
    const spin = Math.sin(time * 3 + star.y * 0.05) * 0.35;
    ctx.save();
    ctx.translate(point.x, cy);
    ctx.scale(1 - Math.abs(spin) * 0.4, 1);
    ctx.rotate(spin * 0.4);
    ctx.fillStyle = PALETTE.star;
    ctx.shadowColor = 'rgba(255, 224, 102, 0.9)';
    ctx.shadowBlur = 16;
    drawStarShape(ctx, 0, 0, 5, 20, 9);
    ctx.restore();
    ctx.fillStyle = '#7a5b00';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FUEL', point.x, cy + 34);
  }
}

function drawStarShape(ctx, cx, cy, spikes, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// The aircraft itself: a top-down jet with a lit canopy, swept wings,
// twin engines and a flame when boosting. Its shadow sits on the
// ground below it, offset and faded by altitude.
export function drawAircraft(ctx, plane, time, invulnerable) {
  const pos = plane.screenPosition();
  const groundY = pos.y + 26 + plane.altitude * 0.09;
  const shadowScale = Math.max(0.35, 1 - plane.altitude / 2200);
  ctx.save();
  ctx.globalAlpha = 0.28 * shadowScale;
  ctx.fillStyle = '#1a2a3a';
  ctx.beginPath();
  ctx.ellipse(pos.x, groundY, 46 * shadowScale, 12 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate((plane.bank * Math.PI) / 180);
  if (invulnerable && Math.floor(time * 8) % 2 === 0) ctx.globalAlpha = 0.35;

  // Engine flame when boosting.
  if (plane.boosting) {
    const flicker = 26 + Math.sin(time * 40) * 8;
    const flame = ctx.createLinearGradient(0, 26, 0, 26 + flicker);
    flame.addColorStop(0, 'rgba(255, 220, 90, 0.95)');
    flame.addColorStop(1, 'rgba(255, 90, 40, 0)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-9, 24);
    ctx.lineTo(0, 26 + flicker);
    ctx.lineTo(9, 24);
    ctx.closePath();
    ctx.fill();
  }

  // Wings and tail, then the fuselage and the glowing canopy.
  ctx.fillStyle = '#c33d2e';
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(-58, 26);
  ctx.lineTo(-50, 34);
  ctx.lineTo(-6, 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6, -6);
  ctx.lineTo(58, 26);
  ctx.lineTo(50, 34);
  ctx.lineTo(6, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8f2a20';
  ctx.beginPath();
  ctx.moveTo(-5, 18);
  ctx.lineTo(-26, 40);
  ctx.lineTo(-18, 42);
  ctx.lineTo(-4, 28);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(5, 18);
  ctx.lineTo(26, 40);
  ctx.lineTo(18, 42);
  ctx.lineTo(4, 28);
  ctx.closePath();
  ctx.fill();

  const body = ctx.createLinearGradient(-8, 0, 8, 0);
  body.addColorStop(0, '#f4f6f8');
  body.addColorStop(0.5, '#dfe6ec');
  body.addColorStop(1, '#b9c4cd');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(0, -46);
  ctx.quadraticCurveTo(10, -20, 8, 8);
  ctx.quadraticCurveTo(7, 30, 0, 36);
  ctx.quadraticCurveTo(-7, 30, -8, 8);
  ctx.quadraticCurveTo(-10, -20, 0, -46);
  ctx.fill();
  ctx.strokeStyle = '#5a6b7a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#123a5c';
  ctx.beginPath();
  ctx.ellipse(0, -18, 6.5, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180, 230, 255, 0.85)';
  ctx.beginPath();
  ctx.ellipse(-1.5, -22, 2.6, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Navigation lights: red left, green right, white tail.
  ctx.fillStyle = '#ff3b30';
  ctx.beginPath();
  ctx.arc(-56, 28, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#34e07a';
  ctx.beginPath();
  ctx.arc(56, 28, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 38, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Floating score popups and impact bursts.
export function drawParticles(ctx, particles) {
  for (const particle of particles) {
    const age = 1 - particle.life / particle.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - age);
    if (particle.text) {
      ctx.fillStyle = particle.color;
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(particle.text, particle.x, particle.y);
    } else {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (1 - age * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function groundElevationUnderPlane(world, plane) {
  return groundElevationAt(world, plane.x, plane.y);
}
