// Redraw scheduling. Anything that changes what is on screen calls requestFrame(); the frame
// handler (set once at startup) advances animations and draws, and returns true while it
// needs another frame. Keeping this separate lets game logic ask for redraws without
// depending on the renderer.

let handler = () => false;
let scheduled = 0;

export function setFrameHandler(fn) {
  handler = fn;
}

export function requestFrame() {
  if (scheduled) return;
  scheduled = requestAnimationFrame(now => {
    scheduled = 0;
    if (handler(now)) requestFrame();
  });
}
