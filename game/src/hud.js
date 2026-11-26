// The HUD, the lit instruments and every screen of Solmara Skies.
// The top bar always shows altitude, speed and heading; the cluster
// in the corner shows the same numbers as glowing dials, and the
// start, pause, win and game-over screens are drawn over the flight.

import { COURSE, LEGS, PALETTE, VIEW } from './config.js';
import { legAt } from './world.js';

function panel(ctx, x, y, w, h, radius = 12) {
  ctx.fillStyle = PALETTE.hudPanel;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function readOut(ctx, x, y, label, value, unit, accent) {
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(234, 246, 255, 0.65)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(label, x, y);
  ctx.fillStyle = accent ? PALETTE.hudAccent : PALETTE.hudText;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(value, x, y + 28);
  if (unit) {
    ctx.fillStyle = 'rgba(234, 246, 255, 0.65)';
    ctx.font = 'bold 12px system-ui, sans-serif';
    const width = ctx.measureText(value).width;
    ctx.fillText(unit, x + width + 6, y + 28);
  }
}

export function drawHud(ctx, game) {
  const plane = game.plane;
  const state = game.state;

  // Top bar: altitude, speed, heading, score, fuel, lives, time.
  panel(ctx, 14, 12, VIEW.width - 28, 64);
  readOut(ctx, 34, 32, 'ALTITUDE', `${Math.round(plane.altitude)}`, 'ft', false);
  readOut(ctx, 178, 32, 'SPEED', `${Math.round(plane.speed)}`, 'kts', false);
  readOut(ctx, 322, 32, 'HEADING', `${String(Math.round(((plane.heading % 360) + 360) % 360)).padStart(3, '0')}°`, '', false);
  readOut(ctx, 466, 32, 'SCORE', `${state.score}`, '', true);

  // Fuel gauge.
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(234, 246, 255, 0.65)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('FUEL', 640, 32);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.roundRect(640, 40, 170, 14, 7);
  ctx.fill();
  const fuelFraction = Math.max(0, state.fuel / 100);
  ctx.fillStyle = fuelFraction > 0.3 ? PALETTE.good : PALETTE.danger;
  ctx.beginPath();
  ctx.roundRect(640, 40, 170 * fuelFraction, 14, 7);
  ctx.fill();
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`${Math.round(state.fuel)}%`, 818, 53);

  // Lives as little planes.
  ctx.fillStyle = 'rgba(234, 246, 255, 0.65)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('LIVES', 900, 32);
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < state.lives ? '#ff8a7a' : 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.moveTo(912 + i * 30, 40);
    ctx.lineTo(924 + i * 30, 56);
    ctx.lineTo(912 + i * 30, 52);
    ctx.lineTo(900 + i * 30, 56);
    ctx.closePath();
    ctx.fill();
  }

  // Timer.
  const remaining = Math.max(0, Math.ceil(state.timeLeft));
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, '0');
  readOut(ctx, 1030, 32, 'TIME', `${minutes}:${seconds}`, '', remaining < 30);
  ctx.fillStyle = 'rgba(234, 246, 255, 0.65)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(legAt(game.plane.y).name.toUpperCase(), 1150, 32);
  ctx.fillText(`${state.ringsPassed} / ${state.ringsTotal} RINGS`, 1150, 52);

  // Current objective, under the top bar.
  const objective = game.currentObjective();
  panel(ctx, 14, 86, 560, 34, 10);
  ctx.fillStyle = PALETTE.hudAccent;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`MISSION: ${objective}`, 30, 108);

  // Distance to the runway.
  const distance = Math.max(0, COURSE.runwayStart - plane.y);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`RUNWAY ${Math.round(distance / 100) / 10} km AHEAD`, VIEW.width - 30, 108);

  drawInstruments(ctx, game);
  drawLegProgress(ctx, game);
}

function drawInstruments(ctx, game) {
  const plane = game.plane;
  const cx = 108;
  const cy = VIEW.height - 104;

  // Artificial horizon: a ball that rolls with the bank and slides
  // with the climb, ringed by a glowing bezel.
  panel(ctx, 22, VIEW.height - 196, 172, 176, 14);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 58, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate((-plane.bank * Math.PI) / 180);
  const pitchOffset = Math.max(-40, Math.min(40, -plane.altitude * 0.02 + 10));
  ctx.fillStyle = '#3d8fd1';
  ctx.fillRect(-70, -70 + pitchOffset, 140, 70 - pitchOffset);
  ctx.fillStyle = '#8a6b45';
  ctx.fillRect(-70, pitchOffset, 140, 70);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(-70, pitchOffset - 2, 140, 4);
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#ffd94d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 58, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(-10, 0);
  ctx.moveTo(10, 0);
  ctx.lineTo(34, 0);
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(234, 246, 255, 0.7)';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ATTITUDE', cx, VIEW.height - 34);

  // Altimeter dial.
  drawDial(ctx, 268, cy, 58, plane.altitude / 1400, 'ALT', `${Math.round(plane.altitude)}`);
  // Airspeed dial.
  drawDial(ctx, 392, cy, 58, (plane.speed - 80) / 320, 'AIRSPEED', `${Math.round(plane.speed)}`);
  // Heading compass strip.
  drawCompass(ctx, 516, cy, plane.heading);
}

function drawDial(ctx, cx, cy, radius, fraction, label, value) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8, 24, 44, 0.82)';
  ctx.fill();
  ctx.strokeStyle = '#ffd94d';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 10; i += 1) {
    const angle = -Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (radius - 8), cy + Math.sin(angle) * (radius - 8));
    ctx.lineTo(cx + Math.cos(angle) * (radius - 2), cy + Math.sin(angle) * (radius - 2));
    ctx.stroke();
  }
  const needleAngle = -Math.PI * 0.75 + Math.max(0, Math.min(1, fraction)) * Math.PI * 1.5;
  ctx.strokeStyle = '#ff5a4e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(needleAngle) * (radius - 12), cy + Math.sin(needleAngle) * (radius - 12));
  ctx.stroke();
  ctx.fillStyle = '#eaf6ff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(value, cx, cy + 24);
  ctx.fillStyle = 'rgba(234, 246, 255, 0.7)';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(label, cx, cy + radius + 16);
  ctx.restore();
}

function drawCompass(ctx, cx, cy, heading) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 58, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8, 24, 44, 0.82)';
  ctx.fill();
  ctx.strokeStyle = '#ffd94d';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.clip();
  ctx.fillStyle = '#eaf6ff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const points = [
    { label: 'N', deg: 0 },
    { label: 'E', deg: 90 },
    { label: 'S', deg: 180 },
    { label: 'W', deg: 270 },
  ];
  for (const point of points) {
    let delta = point.deg - heading;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    const x = cx + delta * 0.55;
    if (x < cx - 58 || x > cx + 58) continue;
    ctx.fillText(point.label, x, cy - 8);
    ctx.fillStyle = 'rgba(234, 246, 255, 0.55)';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.fillText(`${point.deg}°`, x, cy + 12);
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = '#eaf6ff';
  }
  ctx.restore();
  ctx.fillStyle = '#ff5a4e';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 52);
  ctx.lineTo(cx - 6, cy - 38);
  ctx.lineTo(cx + 6, cy - 38);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(234, 246, 255, 0.7)';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HEADING', cx, cy + 74);
}

// A thin strip at the bottom showing the five legs and where the
// plane is along them.
function drawLegProgress(ctx, game) {
  const x = 640;
  const y = VIEW.height - 26;
  const width = 560;
  ctx.fillStyle = 'rgba(8, 24, 44, 0.6)';
  ctx.beginPath();
  ctx.roundRect(x, y, width, 10, 5);
  ctx.fill();
  for (const leg of LEGS) {
    const from = x + (leg.from / COURSE.length) * width;
    const to = x + (leg.to / COURSE.length) * width;
    ctx.fillStyle = 'rgba(255, 217, 77, 0.35)';
    ctx.fillRect(from, y, to - from - 2, 10);
  }
  const planeX = x + Math.min(1, game.plane.y / COURSE.length) * width;
  ctx.fillStyle = '#ff5a4e';
  ctx.beginPath();
  ctx.moveTo(planeX, y - 6);
  ctx.lineTo(planeX - 6, y - 16);
  ctx.lineTo(planeX + 6, y - 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(234, 246, 255, 0.85)';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('COURSE', x - 10, y + 9);
}

function dimScreen(ctx) {
  ctx.fillStyle = 'rgba(6, 18, 34, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function titleBlock(ctx, title, subtitle, y) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 18;
  ctx.fillText(title, VIEW.width / 2, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.hudAccent;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(subtitle, VIEW.width / 2, y + 38);
}

function keyLine(ctx, text, y) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#eaf6ff';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(text, VIEW.width / 2, y);
}

export function drawStartScreen(ctx, game) {
  dimScreen(ctx);
  titleBlock(ctx, 'SOLMARA SKIES', 'Fly the coast, the city and the high pass — then land her.', 190);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('A complete flight game — rings, fuel stars, mountains, balloons and one runway.', VIEW.width / 2, 268);
  keyLine(ctx, '← → or A / D — steer      ↑ ↓ or W / S — climb and descend', 330);
  keyLine(ctx, 'Mouse — steer toward the pointer      SHIFT or click — boost', 360);
  keyLine(ctx, 'Fly through the gold rings, collect fuel stars, dodge peaks, towers and balloons.', 390);
  keyLine(ctx, 'Land on the runway at the end of the course before the fuel or the clock runs out.', 418);
  ctx.fillStyle = PALETTE.hudAccent;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('Press ENTER or click to take off', VIEW.width / 2, 490);
  ctx.fillStyle = 'rgba(234, 246, 255, 0.75)';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('3 lives  •  300 seconds  •  17 rings  •  land for the bonus', VIEW.width / 2, 530);
  void game;
}

export function drawPauseScreen(ctx) {
  dimScreen(ctx);
  titleBlock(ctx, 'PAUSED', 'The sky is waiting.', 300);
  keyLine(ctx, 'Press P to keep flying — ESC or ENTER works too.', 380);
}

export function drawGameOverScreen(ctx, game) {
  dimScreen(ctx);
  titleBlock(ctx, 'FLIGHT OVER', game.state.endReason, 240);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`Score ${game.state.score}   •   Rings ${game.state.ringsPassed} / ${game.state.ringsTotal}`, VIEW.width / 2, 320);
  ctx.fillStyle = 'rgba(234, 246, 255, 0.8)';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('The runway is still out there. Press ENTER to fly again.', VIEW.width / 2, 372);
}

export function drawWinScreen(ctx, game) {
  dimScreen(ctx);
  titleBlock(ctx, 'LANDED!', 'A perfect arrival at Solmara International.', 220);
  const state = game.state;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(`Score ${state.score}  •  Rings ${state.ringsPassed} / ${state.ringsTotal}  •  Fuel left ${Math.round(state.fuel)}%`, VIEW.width / 2, 300);
  ctx.fillStyle = PALETTE.good;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(`Landing bonus +${state.landingBonus} — time and fuel counted in.`, VIEW.width / 2, 340);
  ctx.fillStyle = 'rgba(234, 246, 255, 0.8)';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('Press ENTER to fly the course again.', VIEW.width / 2, 392);
}

export function drawToast(ctx, toast) {
  if (!toast) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, toast.life / 0.6));
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 12;
  ctx.fillText(toast.text, VIEW.width / 2, 170);
  ctx.restore();
}
