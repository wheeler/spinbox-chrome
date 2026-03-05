/**
 * Extract Track Info from the SoundList element
 * @param element {HTMLElement}
 * @returns {{artistName: string, artistHref: string, trackName: string, trackHref: string, imageUrl: string, reposterName: string, reposterHref: string}}
 */
export function getSoundListElementInfo(element) {
  let artistName,
    artistHref,
    trackName,
    trackHref,
    imageUrl,
    reposterName,
    reposterHref;

  const artistElement = element.querySelector('a.soundTitle__username');
  if (artistElement) {
    artistHref = artistElement.getAttribute('href');
    artistName = artistElement.innerText.trim();
  }

  const titleElement = element.querySelector('a.soundTitle__title');
  if (titleElement) {
    trackHref = titleElement.getAttribute('href');
    trackName = titleElement.innerText.trim();
  }

  const imageElement = element.querySelector(
    'div.sound__artwork span.image__full'
  );
  if (imageElement) {
    // Extract the image URL from the background-image style
    const bgImage = imageElement.style.backgroundImage;
    if (bgImage) {
      // Remove url("...") wrapper and get the actual URL
      imageUrl = bgImage.replace(/^url\(['"](.+)['"]\)$/, '$1');
    }
  }

  const repostIndicator = element.querySelector('.soundContext__repost');
  if (repostIndicator) {
    const reposterElement = repostIndicator.previousElementSibling;
    reposterHref = reposterElement.getAttribute('href');
    reposterName = reposterElement.innerText.trim();
  }

  return {
    artistName,
    artistHref,
    trackName,
    trackHref,
    imageUrl,
    reposterName,
    reposterHref,
  };
}

export function soundListElementIsCurrentlyPlaying(element) {
  return element
    .querySelector('div.sound.streamContext')
    .classList.contains('playing');
}

export function updateHiddenTrackCount(newCount) {
  const hiddenTracksCount = document.getElementById('hiddenTracksCount');
  if (hiddenTracksCount) {
    hiddenTracksCount.textContent = newCount.toString();

    const hiddenTracksPlural = document.getElementById('hiddenTracksPlural');
    if (hiddenTracksPlural) {
      if (newCount === 1) hiddenTracksPlural.textContent = '';
      else hiddenTracksPlural.textContent = 's';
    }
  }
}
