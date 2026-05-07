/**
 * Utilities for interacting with the SoundCloud player on the page.
 */

const spaceKey = {
  keyCode: 32,
  which: 32,
  key: ' ',
  code: 'Space',
  location: 0,
};

const shiftRightArrowKey = {
  keyCode: 39,
  which: 39,
  key: 'ArrowRight',
  code: 'ArrowRight',
  location: 0,
  shiftKey: true,
  bubbles: true,
};

export function playNext(element) {
  const target = element || document;
  const keyDown = new KeyboardEvent('keydown', shiftRightArrowKey);
  const keyUp = new KeyboardEvent('keyup', shiftRightArrowKey);
  target.dispatchEvent(keyDown);
  target.dispatchEvent(keyUp);
}

export function playPause() {
  const keyDown = new KeyboardEvent('keydown', spaceKey);
  const keyUp = new KeyboardEvent('keyup', spaceKey);
  document.dispatchEvent(keyDown);
  document.dispatchEvent(keyUp);
}

/**
 * detect if the SoundCloud player is currently playing based on the play button state in the footer player
 * @returns {boolean}
 */
export function isPlaying() {
  const playButton = document.querySelector('button.playControls__play');
  return playButton && playButton.classList.contains('playing');
}
