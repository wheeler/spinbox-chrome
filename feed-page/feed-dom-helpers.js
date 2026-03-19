import {
  createNoHiddenTracksMessage,
  createRecentlyHiddenTrackElement,
} from './new-elements.js';

/**
 * add flag to a stream list within the contentElement
 * @param contentElement
 */
export function addDisableVisualExpandFlagToStreamList(contentElement) {
  const addedStreamList = contentElement?.querySelector('div.stream__list');
  addedStreamList?.classList.add('spinbox-disable-visual-expand');
}

/**
 * Extract Track Info from the SoundList element
 * @param element {HTMLElement}
 * @returns {{artistName: string, artistHref: string, trackName: string, trackHref: string, imageUrl: string, reposterName: string, reposterHref: string}}
 */
export function getSoundListElementInfo(element) {
  let info = {};

  const artistElement = element.querySelector('a.soundTitle__username');
  info.artistHref = artistElement?.getAttribute('href');
  const artistTextElement = element.querySelector(
    'span.soundTitle__usernameText'
  );
  info.artistName = artistTextElement?.textContent?.trim();

  const titleElement = element.querySelector('a.soundTitle__title');
  info.trackHref = titleElement?.getAttribute('href');
  info.trackName = titleElement?.textContent?.trim();

  const imageElement = element.querySelector(
    'div.sound__artwork span.image__full'
  );
  if (imageElement) {
    // Extract the image URL from the background-image style
    const bgImage = imageElement.style.backgroundImage;
    if (bgImage) {
      // Remove url("...") wrapper and get the actual URL
      info.imageUrl = bgImage.replace(/^url\(['"](.+)['"]\)$/, '$1');
    }
  }

  const repostIndicator = element.querySelector('.soundContext__repost');
  if (repostIndicator) {
    const reposterElement = repostIndicator.previousElementSibling;
    info.reposterHref = reposterElement?.getAttribute('href');
    info.reposterName = reposterElement?.textContent?.trim();
  }

  return info;
}

export function soundListElementIsCurrentlyPlaying(element) {
  return element
    .querySelector('div.soundTitle__playButton a.playButton')
    .classList.contains('sc-button-pause');
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

export function unhideTrackElementWithHref(targetHref) {
  // Remove hidden class from any matching tracks in the feed
  document
    .querySelectorAll('.soundList__item.spinbox-hidden')
    .forEach((element) => {
      const { trackHref } = getSoundListElementInfo(element);
      if (trackHref === targetHref) {
        element.classList.remove('spinbox-hidden');
      }
    });
}

export function renderRecentlyHiddenTracksList(
  recentlyHiddenTracks,
  undoHideFn
) {
  const hiddenList = document.getElementById('recentlyHiddenTrackList');
  if (!hiddenList) return;

  let newElements;
  if (recentlyHiddenTracks.length === 0) {
    newElements = [createNoHiddenTracksMessage()];
  } else {
    newElements = recentlyHiddenTracks.map((track) =>
      createRecentlyHiddenTrackElement(track, undoHideFn)
    );
  }
  hiddenList.replaceChildren(...newElements);
}
