// The aircraft: position, speed, altitude, heading and bank.
// The plane always flies north up the course; steering changes its
// heading, and the heading carries it sideways. Throttle sets speed,
// the stick sets climb, and the bank follows the turn so the plane
// leans into every corner it takes.

import { COURSE, PLANE, VIEW } from './config.js';

export class Aircraft {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.altitude = COURSE.startAltitude;
    this.speed = COURSE.startSpeed;
    this.heading = 0; // degrees, 0 is due north, + is east
    this.bank = 0; // degrees of roll, shown on the plane and the horizon
    this.throttle = 0.62;
    this.boosting = false;
    this.engineOut = false;
  }

  update(dt, controls) {
    const steer = controls.steer();
    const pitch = controls.pitch();
    this.boosting = controls.boosting() && !this.engineOut;

    // Heading and bank: the plane turns toward the stick and the bank
    // eases toward the turn so the roll always reads.
    const targetBank = steer * PLANE.maxBankDegrees;
    this.bank += (targetBank - this.bank) * Math.min(1, dt * 6);
    this.heading += steer * PLANE.turnRate * dt;
    this.heading = Math.max(-55, Math.min(55, this.heading));

    // Speed: throttle pulls toward cruise, boost pushes past it, and
    // an empty tank lets the speed bleed away.
    const targetSpeed = this.engineOut
      ? PLANE.minSpeed * 0.85
      : this.boosting
        ? PLANE.boostSpeed
        : PLANE.minSpeed + this.throttle * (PLANE.maxSpeed - PLANE.minSpeed);
    const pull = this.boosting ? 0.9 : 0.55;
    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * pull);

    // Climb: pull up to gain altitude, push down to lose it. Climbing
    // costs a little speed; diving gives some back.
    const climb = pitch * PLANE.climbRate;
    this.altitude += climb * dt;
    if (pitch > 0) this.speed -= 14 * dt * pitch;
    if (pitch < 0) this.speed += 10 * dt * -pitch;
    this.altitude = Math.max(PLANE.minAltitude, Math.min(PLANE.maxAltitude, this.altitude));

    // Forward motion and the sideways drift from the heading.
    const headingRadians = (this.heading * Math.PI) / 180;
    const forward = this.speed * 2.6; // world units per second
    this.y += forward * dt;
    this.x += Math.sin(headingRadians) * forward * dt;

    // The course is wide but not endless: soft walls push the plane back.
    if (this.x < -640) {
      this.x = -640;
      this.heading = Math.max(this.heading, -8);
    }
    if (this.x > 640) {
      this.x = 640;
      this.heading = Math.min(this.heading, 8);
    }
  }

  // Screen position of the plane, fixed so the world moves past it.
  screenPosition() {
    return { x: VIEW.planeScreenX, y: VIEW.planeScreenY };
  }
}
