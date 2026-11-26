// Keyboard and mouse input for Solmara Skies.
// The game reads this one object every frame; the browser listeners
// only flip flags, so input never depends on event timing.

export class FlightControls {
  constructor(canvas) {
    this.keys = new Set();
    this.mouseX = null;
    this.mouseY = null;
    this.mouseDown = false;
    this.mouseActive = false;
    this.pressed = new Set(); // keys pressed since last consume
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouseDown = false;
    });

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
      this.mouseActive = true;
    });
    canvas.addEventListener('mousedown', (event) => {
      if (event.button === 0) this.mouseDown = true;
    });
    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
    canvas.addEventListener('mouseleave', () => {
      this.mouseActive = false;
    });
  }

  held(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  consumePressed() {
    this.pressed.clear();
  }

  // Steering intent from -1 (hard left) to +1 (hard right).
  steer() {
    let value = 0;
    if (this.held('ArrowLeft') || this.held('KeyA')) value -= 1;
    if (this.held('ArrowRight') || this.held('KeyD')) value += 1;
    if (value === 0 && this.mouseActive && this.mouseX !== null) {
      const offset = (this.mouseX - this.canvas.width / 2) / (this.canvas.width / 2);
      if (Math.abs(offset) > 0.08) value = Math.max(-1, Math.min(1, offset * 1.4));
    }
    return value;
  }

  // Climb intent from -1 (descend) to +1 (climb).
  pitch() {
    let value = 0;
    if (this.held('ArrowUp') || this.held('KeyW')) value += 1;
    if (this.held('ArrowDown') || this.held('KeyS')) value -= 1;
    if (value === 0 && this.mouseActive && this.mouseY !== null) {
      const offset = (this.mouseY - this.canvas.height * 0.62) / (this.canvas.height * 0.38);
      if (Math.abs(offset) > 0.12) value = Math.max(-1, Math.min(1, -offset * 1.1));
    }
    return value;
  }

  boosting() {
    return this.held('ShiftLeft') || this.held('ShiftRight') || this.mouseDown;
  }
}
