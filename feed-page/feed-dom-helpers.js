import {
  createCouldNotFindPlaylistMessage,
  createNoHiddenTracksMessage,
  createRecentlyHiddenTrackElement,
} from './new-elements.js';
import { NUM_RECENT_HIDDEN_TRACKS_DISPLAYED } from './data-storage.js';

/**
 * add the flag to a stream list within the contentElement
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

export function findPlayingElement() {
  return document.querySelector('.sound.playing')?.closest('.soundList__item');
}

export function soundListElementIsCurrentlyPlaying(element) {
  return element
    .querySelector('div.soundTitle__playButton a.playButton')
    .classList.contains('sc-button-pause');
}

export function addRecentlyHiddenTrack(info, undoHideFn) {
  const hiddenList = document.getElementById('recentlyHiddenTrackList');
  if (hiddenList) {
    document.getElementById('noHiddenTracks')?.remove();
    if (hiddenList.childElementCount === NUM_RECENT_HIDDEN_TRACKS_DISPLAYED) {
      hiddenList.removeChild(hiddenList.lastElementChild);
    }
    hiddenList.prepend(createRecentlyHiddenTrackElement(info, undoHideFn));
  }
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

export function openAddToPlaylistModal(trackElement) {
  trackElement.querySelector('.sc-button-more').click();
  document.querySelector('.moreActions .sc-button-addtoset').click();
}

/**
 * Wait for a playlist item with the given title to appear in the DOM.
 * Checks on every page mutation.
 * Returns the element. If it doesn't appear within the timeout, return null.
 * @param title
 * @param timeout
 * @returns {Promise}
 */
export function waitForPlaylistItem(title, timeout = 3000) {
  const item = queryPlaylistItem(title);
  if (item) return Promise.resolve(item);

  return new Promise((resolve) => {
    let timer;
    const observer = new MutationObserver(() => {
      // note - we ignore the mutations parameter because we're using the mutation observer as "anything changed on the page"
      const item = queryPlaylistItem(title);
      if (item) {
        clearTimeout(timer);
        observer.disconnect();
        resolve(item);
      }
    });

    // observe all document mutations
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // if not found within timeout, disconnect observer and resolve with null
    timer = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

export function queryPlaylistItem(title) {
  return document.querySelector(
    `.addToPlaylistList__item:has(a.addToPlaylistItem__titleLink[title="${title}"])`
  );
}

export function clickAddToPlaylist(playlistItemElement) {
  // `sc-button-selected` is a way to determine the button says "Added" that is not language-dependent
  const button = playlistItemElement.querySelector(
    'button[type="submit"]:not(.sc-button-selected)'
  );
  button?.click();
}

export function addCouldNotFindPlaylistMessage(playlistName) {
  document
    .querySelector('.addToPlaylistList__list')
    .prepend(createCouldNotFindPlaylistMessage(playlistName));
}

export function closeModal() {
  document.querySelector('button.modal__closeButton')?.click();
}
