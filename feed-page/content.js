import { playNext } from './soundcloud-player';
import {
  createHideTrackButton,
  createRepostSvg,
  createSidebarElement,
} from './new-elements';
import { forceLoadingMoreTracks } from './page-utilities';
import {
  getSoundListElementInfo,
  soundListElementIsCurrentlyPlaying,
  updateHiddenTrackCount,
} from './feed-dom-helpers';
import { getRecentElementsFromArray } from './data-helpers';

console.log('spinbox loading');

window.spinbox = window.spinbox || { settings: {}, digSettings: {} };

const storageLoadingPromise = chrome.storage.local.get('hiddenTracks');
const digSettingsPromise = chrome.storage.local.get('digSettings');
const settingsPromise = chrome.storage.local.get('settings');

// TODO: listen for messages

async function hideSoundListElement(element) {
  // re-read the info from the element. less data in closure and images may have been lazy loaded
  const info = getSoundListElementInfo(element);
  // set track as hidden in local var
  spinbox.hiddenTracks[info.trackHref] = {
    ...info,
    hiddenAt: new Date().toISOString(),
    hiddenAtTs: Date.now(),
  };
  // set hidden in chrome storage
  await chrome.storage.local.set({ hiddenTracks: spinbox.hiddenTracks });
  // hide element
  element.classList.add('spinbox-hidden');

  // move to next track if playing. TODO: test more to make sure it's working.
  if (soundListElementIsCurrentlyPlaying(element)) {
    playNext(element);
  }

  forceLoadingMoreTracks();

  // update sidebar content
  updateHiddenTrackCount(Object.keys(spinbox.hiddenTracks).length);
  updateRecentlyHiddenTracksDescription(info);
}

function processNewSoundListElements(soundListElements) {
  let hidSomeElements = false;
  soundListElements.forEach((element) => {
    if (
      !element.classList.contains('soundList__item') ||
      element.classList.contains('spinbox-processed')
    ) {
      // element is either not an expected sound list item or has already been processed
      return;
    }

    // mark as processed
    element.classList.add('spinbox-processed');

    // hide if it should be hidden
    const info = getSoundListElementInfo(element);
    if (spinbox.hiddenTracks[info.trackHref]) {
      element.classList.add('spinbox-hidden');
      hidSomeElements = true;
    }

    // add buttons to the "context" element - which sits above the track player in the feed
    // (designed to handle multiple buttons)
    const contextElement = element.querySelector('div.soundContext');
    const buttons = [];
    if (contextElement) {
      // TODO: add "dig" button

      const hideButton = createHideTrackButton(() =>
        hideSoundListElement(element)
      );
      buttons.push(hideButton);

      buttons[0].style.marginLeft = 'auto'; // left align all buttons
      buttons.forEach((button) => contextElement.appendChild(button));
    }
  });

  if (hidSomeElements) {
    forceLoadingMoreTracks();
  }
}

function createRecentlyHiddenTrackElement(track) {
  const trackElement = document.createElement('li');
  trackElement.className = 'spinbox-recently-hidden-track sc-mb-0.5x';

  const imageContainer = document.createElement('span');
  imageContainer.className = 'spinbox-track-image';
  if (track.imageUrl) {
    imageContainer.style.backgroundImage = `url('${track.imageUrl}')`;
  }
  trackElement.appendChild(imageContainer);

  const undoHideButton = document.createElement('button');
  undoHideButton.className =
    'spinbox-undo-hide-button sc-button sc-button-secondary';
  undoHideButton.innerText = '⟲';
  undoHideButton.ariaLabel = 'Un-Hide Track';
  undoHideButton.title = 'Un-Hide Track';

  // Add click handler for undo
  undoHideButton.onclick = async () => {
    // Remove from hiddenTracks
    delete spinbox.hiddenTracks[track.trackHref];

    // Update storage
    await chrome.storage.local.set({ hiddenTracks: spinbox.hiddenTracks });

    // Remove hidden class from any matching tracks in the feed
    document
      .querySelectorAll('.soundList__item.spinbox-hidden')
      .forEach((element) => {
        const info = getSoundListElementInfo(element);
        if (info.trackHref === track.trackHref) {
          element.classList.remove('spinbox-hidden');
        }
      });

    // Update the recently hidden tracks list
    setupRecentlyHiddenTracks(); // needed to find the now nth recently hidden track
    updateHiddenTrackCount(Object.keys(spinbox.hiddenTracks).length);
    updateRecentlyHiddenTracksDescription(); // needed to restore the nth recent hidden track row
  };

  const hiddenTrackDescription = document.createElement('div');
  hiddenTrackDescription.className = 'spinbox-hidden-track-description';

  const hiddenTrackDescriptionArtist = document.createElement('div');
  hiddenTrackDescriptionArtist.className =
    'spinbox-hidden-track-description-artist';
  if (track.reposterName) {
    hiddenTrackDescriptionArtist.appendChild(
      document.createTextNode(track.reposterName)
    );
    hiddenTrackDescriptionArtist.appendChild(createRepostSvg());
  }
  hiddenTrackDescriptionArtist.appendChild(
    document.createTextNode(track.artistName)
  );

  const hiddenTrackDescriptionTrack = document.createElement('div');
  hiddenTrackDescriptionTrack.className =
    'spinbox-hidden-track-description-track';
  hiddenTrackDescriptionTrack.innerText = track.trackName;

  hiddenTrackDescription.appendChild(hiddenTrackDescriptionArtist);
  hiddenTrackDescription.appendChild(hiddenTrackDescriptionTrack);

  trackElement.appendChild(hiddenTrackDescription);
  trackElement.appendChild(undoHideButton);

  return trackElement;
}

function updateRecentlyHiddenTracksDescription(info) {
  const hiddenList = document.getElementById('recentlyHiddenTrackList');
  if (hiddenList) {
    if (info) {
      // we're adding a single new hidden track
      const noHiddenTracks = document.getElementById('noHiddenTracks');
      if (noHiddenTracks) {
        noHiddenTracks.remove();
      }
      if (hiddenList.childElementCount > 4) {
        hiddenList.removeChild(hiddenList.lastElementChild);
      }
      hiddenList.prepend(createRecentlyHiddenTrackElement(info));
    } else if (spinbox.recentlyHiddenTracks) {
      if (spinbox.recentlyHiddenTracks.length === 0) {
        const noHiddenTracks = document.createElement('li');
        noHiddenTracks.id = 'noHiddenTracks';
        noHiddenTracks.className = 'spinbox-recently-hidden-track sc-mb-0.5x';
        noHiddenTracks.textContent = 'No hidden tracks yet';
        hiddenList.replaceChildren(noHiddenTracks);
      } else {
        const tracks = spinbox.recentlyHiddenTracks.map((track) =>
          createRecentlyHiddenTrackElement(track)
        );
        hiddenList.replaceChildren(...tracks);
      }
    }
  }
}

async function setupMutationObserver() {
  const appNode = document.getElementById('app');

  if (!appNode) {
    console.error('Target node not found for MutationObserver.');
    return;
  }

  await settingsPromise;

  // Callback function to execute when mutations are observed
  const callback = (mutations, _observer) => {
    const addedSoundListItems = [];
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        if (
          mutation.target.id === 'content' &&
          mutation.target.baseURI.endsWith('feed')
        ) {
          // handle the content element being initially populated (or re-populated on page navigation)

          // Set up the disable-visual-expand based on the setting
          if (!spinbox.settings.overrideDisableVisualExpand) {
            const streamList =
              mutation.target.querySelector('div.stream__list');
            if (streamList) {
              streamList.classList.add('spinbox-disable-visual-expand');
            }
          }

          // Create the sidebar
          const spinboxSidebar = mutation.target.querySelector(
            'article.spinbox-sidebar'
          );
          if (!spinboxSidebar) {
            const SCsidebarElement =
              mutation.target.querySelector('div.streamSidebar');
            if (!SCsidebarElement) {
              console.log('Spinbox - no sidebar?'); // when can this happen?
            } else {
              SCsidebarElement.prepend(createSidebarElement());
              updateHiddenTrackCount(Object.keys(spinbox.hiddenTracks).length);
              updateRecentlyHiddenTracksDescription();
            }
          }

          // check for already loaded but unprocessed nodes - seems to happen on navigation returning to the feed
          const existingSoundListItems = mutation.target.querySelectorAll(
            'li.soundList__item:not(.spinbox-processed)'
          );
          if (existingSoundListItems && existingSoundListItems.length)
            addedSoundListItems.push(...existingSoundListItems);
        } else if (
          mutation.target.classList.contains('lazyLoadingList__list') &&
          mutation.target.baseURI.endsWith('feed')
        ) {
          // handle lazy loading of tracks (during initial loading or when added on scroll)
          mutation.addedNodes.forEach((node) => {
            if (node.classList && node.classList.contains('soundList__item')) {
              addedSoundListItems.push(node);
            }
          });
        }
      }
    }
    // if either of these mutations resulted in new added items - process them now
    if (addedSoundListItems.length !== 0) {
      processNewSoundListElements(addedSoundListItems);
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  // Options for the observer (which mutations to observe)
  const observerConfig = { attributes: false, childList: true, subtree: true };

  // Start observing the target node for configured mutations
  observer.observe(appNode, observerConfig);
}

async function loadHiddenTracks() {
  spinbox.hiddenTracks = (await storageLoadingPromise).hiddenTracks || {};
  setupRecentlyHiddenTracks(); // TODO: when list is long should we defer this?
  updateHiddenTrackCount(Object.keys(spinbox.hiddenTracks).length);
  updateRecentlyHiddenTracksDescription();
}

async function loadSettings() {
  spinbox.digSettings = (await digSettingsPromise).digSettings || {};
  spinbox.settings = (await settingsPromise).settings || {};
}

function setupRecentlyHiddenTracks() {
  spinbox.recentlyHiddenTracks = getRecentElementsFromArray(
    Object.values(spinbox.hiddenTracks),
    'hiddenAtTs',
    5
  );
}

/** --------------------
 *    INITIALIZATION
 *----------------------- */

loadSettings();
loadHiddenTracks();
setupMutationObserver();
