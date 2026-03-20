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

console.log('Spinbox - loading');

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
    const contextElement = element.querySelector('div.soundContext');
    // (layout is designed to handle multiple buttons in the future)
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

function setupSpinboxSidebarElement(contentElement) {
  if (!contentElement) return;
  const streamSidebar = contentElement.querySelector('div.streamSidebar');
  if (!streamSidebar) {
    console.log(
      'Spinbox cannot add sidebar element - no SoundCloud sidebar found?'
    );
    return;
  }

  // Add spinbox sidebar element
  let spinboxSidebar = contentElement.querySelector('.spinbox-sidebar');
  if (!spinboxSidebar) {
    spinboxSidebar = createSidebarElement();
    streamSidebar.prepend(spinboxSidebar);
  }

  updateHiddenTrackCount(spinboxStorage.hiddenTrackCount());
  renderRecentlyHiddenTracksListWithContext();
}

/**
 * This mutation observer handles changes to id='content' (while on feed page)
 * -- apply the 'spinbox-disable-visual-expand' class
 * -- create the spinbox sidebar element if absent
 * -- process any SoundListElements that are already in the added content
 */
function setupContentMutationObserver() {
  console.log('Spinbox - setting up content observer');
  const contentNode = document.getElementById('content');
  if (!contentNode) {
    console.warn(
      'Spinbox - tried to set up content observer when #content did not exist.'
    );
    return;
  }

  const onContentMutation = (mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === 'childList' &&
        mutation.addedNodes.length &&
        mutation.target.baseURI.endsWith('feed')
      ) {
        const [newContent] = mutation.addedNodes;
        if (mutation.addedNodes.length > 1) {
          console.warn(
            'Spinbox - expected content to be replaced with a single node but was multiple.'
          );
        }

        // Add the disable-visual-expand class based on the setting
        if (!spinboxStorage.settings.overrideDisableVisualExpand) {
          addDisableVisualExpandFlagToStreamList(newContent);
        }

        // Create and fill in the sidebar element
        setupSpinboxSidebarElement(newContent);

        // check for already loaded but unprocessed nodes
        // seems to happen on SPA navigation returning to the feed from another page
        const existingSoundListItems = mutation.target.querySelectorAll(
          'li.soundList__item:not(.spinbox-processed)'
        );
        processNewSoundListElements(existingSoundListItems);

        // set up the list observer
        const lazyList = newContent.querySelector('.lazyLoadingList');
        setupSoundListMutationObserver(lazyList);
      }
    });
  };

  const contentObserver = new MutationObserver(onContentMutation);
  contentObserver.observe(contentNode, { childList: true, subtree: false });
}

/**
 * This mutation observer handles SoundListItems added dynamically to the page.
 * These are nodes of class 'soundList__item' are added to the 'lazyLoadingList__list'
 * This happens during the initial page population and when scrolling causes more track to load.
 */
function setupSoundListMutationObserver(targetNode) {
  if (!targetNode) {
    console.error('Target node not found for MutationObserver.');
    return;
  }
  console.log('Spinbox - setting up sound list observer');

  const onSoundListMutation = (mutations, _observer) => {
    const addedSoundListItems = [];
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        if (
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
    // process any added items
    processNewSoundListElements(addedSoundListItems);
  };

  const observer = new MutationObserver(onSoundListMutation);
  observer.observe(targetNode, { childList: true, subtree: true });
}

/** --------------------
 *    INITIALIZATION
 *----------------------- */

const init = async () => {
  await spinboxStorage.initialLoad();
  setupContentMutationObserver();
};

init();
