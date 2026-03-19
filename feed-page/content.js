import { playNext } from './soundcloud-player';
import {
  createHideTrackButton,
  createRecentlyHiddenTrackElement,
  createSidebarElement,
} from './new-elements';
import { forceLoadingMoreTracks } from './page-utilities';
import {
  addDisableVisualExpandFlagToStreamList,
  getSoundListElementInfo,
  renderRecentlyHiddenTracksList,
  soundListElementIsCurrentlyPlaying,
  unhideTrackElementWithHref,
  updateHiddenTrackCount,
} from './feed-dom-helpers';
import SpinboxStorage from './data-storage.js';

console.log('spinbox loading');

const spinboxStorage = new SpinboxStorage();

// TODO: listen for messages

async function hideSoundListElement(element) {
  // re-read the info from the element. less data in closure and images may have been lazy-loaded
  const info = getSoundListElementInfo(element);
  await spinboxStorage.hideTrack(info);
  // hide element
  element.classList.add('spinbox-hidden');

  // move to the next track if playing.
  if (soundListElementIsCurrentlyPlaying(element)) {
    playNext(element);
  }

  forceLoadingMoreTracks();

  // update sidebar content
  updateHiddenTrackCount(spinboxStorage.hiddenTrackCount());
  addRecentlyHiddenTrack(info);
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
    const { trackHref } = getSoundListElementInfo(element);
    if (spinboxStorage.trackIsHidden(trackHref)) {
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
      contextElement.append(...buttons);
    }
  });

  if (hidSomeElements) {
    forceLoadingMoreTracks();
  }
}

function renderRecentlyHiddenTracksListWithContext() {
  renderRecentlyHiddenTracksList(
    spinboxStorage.recentlyHiddenTracks,
    undoHideTrack
  );
}

async function undoHideTrack(trackHref) {
  await spinboxStorage.unhideTrack(trackHref);
  unhideTrackElementWithHref(trackHref);
  updateHiddenTrackCount(spinboxStorage.hiddenTrackCount());
  renderRecentlyHiddenTracksListWithContext(); // needed to restore the nth recent hidden track row
}

function addRecentlyHiddenTrack(info) {
  const hiddenList = document.getElementById('recentlyHiddenTrackList');
  if (hiddenList) {
    document.getElementById('noHiddenTracks')?.remove();
    if (hiddenList.childElementCount > 4) {
      hiddenList.removeChild(hiddenList.lastElementChild);
    }
    hiddenList.prepend(createRecentlyHiddenTrackElement(info, undoHideTrack));
  }
}

function setupMutationObserver() {
  const appNode = document.getElementById('app');

  if (!appNode) {
    console.error('Target node not found for MutationObserver.');
    return;
  }

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
          if (!spinboxStorage.settings.overrideDisableVisualExpand) {
            addDisableVisualExpandFlagToStreamList(mutation.target);
          }

          // Create the sidebar
          const spinboxSidebar = mutation.target.querySelector(
            'article.spinbox-sidebar'
          );
          if (!spinboxSidebar) {
            const streamSidebar =
              mutation.target.querySelector('div.streamSidebar');
            if (!streamSidebar) {
              console.log('Spinbox - no sidebar?'); // when can this happen?
            } else {
              streamSidebar.prepend(createSidebarElement());
              updateHiddenTrackCount(spinboxStorage.hiddenTrackCount());
              renderRecentlyHiddenTracksListWithContext();
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

/** --------------------
 *    INITIALIZATION
 *----------------------- */

const init = async () => {
  await spinboxStorage.initialLoad();
  updateHiddenTrackCount(spinboxStorage.hiddenTrackCount());
  renderRecentlyHiddenTracksListWithContext();
  setupMutationObserver();
};

init();
