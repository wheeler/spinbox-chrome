import { playNext, isPlaying } from './soundcloud-player';
import {
  createPullTrackButton,
  createHideTrackButton,
  createSidebarElement,
} from './new-elements';
import { forceLoadingMoreTracks } from './page-utilities';
import {
  addCouldNotFindPlaylistMessage,
  addDisableVisualExpandFlagToStreamList,
  addRecentlyHiddenTrack,
  clickAddToPlaylist,
  closeModal,
  findPlayingElement,
  getSoundListElementInfo,
  openAddToPlaylistModal,
  renderRecentlyHiddenTracksList,
  soundListElementIsCurrentlyPlaying,
  unhideTrackElementWithHref,
  updateHiddenTrackCount,
  waitForPlaylistItem,
} from './feed-dom-helpers';
import SpinboxStorage from './data-storage';

console.log('Spinbox - loading');

const spinboxStorage = new SpinboxStorage();

// TODO: listen for messages

async function pullTrackManually(element) {
  const pullTitle = spinboxStorage.settings.pullPlaylist;
  if (!pullTitle) {
    console.error('Spinbox - no pull playlist set');
    element.querySelector('button.spinbox-pull').style.color =
      'var(--font-error-color)';
    document.getElementById('spinboxSidebarErrorMessage').textContent =
      'No Pull Playlist Set. Please open the extension settings popup to set a target playlist.';
    return;
  }

  openAddToPlaylistModal(element);

  // TODO: if no pull playlist setting - inject with buttons to set

  const playlistItem = await waitForPlaylistItem(pullTitle);

  if (playlistItem) {
    clickAddToPlaylist(playlistItem);
    closeModal();
    await hideSoundListElement(element);
  } else {
    addCouldNotFindPlaylistMessage(pullTitle);
  }
}

async function hideSoundListElement(element) {
  // re-read the info from the element. less data in closure and images may have been lazy-loaded
  const info = getSoundListElementInfo(element);
  if (spinboxStorage.trackIsHidden(info.trackHref)) return;

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
  addRecentlyHiddenTrack(info, undoHideTrack);
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
      // don't show pull for playlists - they can't be pulled as a whole
      const isPlaylist = !!element.querySelector('.sound.playlist');
      if (!isPlaylist) {
        const pullButton = createPullTrackButton(() =>
          pullTrackManually(element)
        );
        buttons.push(pullButton);
      }

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

function modifyFeedContent(contentElement) {
  // Add the disable-visual-expand class based on the setting
  if (!spinboxStorage.settings.overrideDisableVisualExpand) {
    addDisableVisualExpandFlagToStreamList(contentElement);
  }

  // Create and fill in the sidebar element
  setupSpinboxSidebarElement(contentElement);

  // check for already loaded but unprocessed nodes
  // seems to happen on SPA navigation returning to the feed from another page
  const existingSoundListItems = contentElement.querySelectorAll(
    'li.soundList__item:not(.spinbox-processed)'
  );
  processNewSoundListElements(existingSoundListItems);

  // set up the list observer
  const lazyList = contentElement.querySelector('.lazyLoadingList');
  setupSoundListMutationObserver(lazyList);
}

/**
 * This mutation observer handles changes to id='content' (while on the feed page)
 * -- apply the 'spinbox-disable-visual-expand' class
 * -- create the spinbox sidebar element if absent
 * -- process any SoundListElements that are already in the added content
 */
function setupContentMutationObserver() {
  console.log('Spinbox - setting up content observer');
  const content = document.getElementById('content');
  if (!content) {
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
        modifyFeedContent(newContent);
      }
    });
  };

  // if the content element has already loaded the feed content, modify it now.
  // we still need the mutation observer to handle SPA navigation.
  if (
    content.querySelector('div.stream__list') &&
    content.querySelector('div.streamSidebar')
  ) {
    modifyFeedContent(content);
  }

  const contentObserver = new MutationObserver(onContentMutation);
  contentObserver.observe(content, { childList: true, subtree: false });
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

function setupKeyboardShortcuts() {
  document.addEventListener('keyup', (event) => {
    if (event.key === 'x') {
      if (isPlaying()) {
        console.log('spinbox: this will hide the current track');
        const track = findPlayingElement();
        if (track) {
          // for some reason the first time this is used on a page it works poorly - track appears hidden for a while before dissapearing?
          hideSoundListElement(track);
        } else {
          console.log(
            'spinbox: hide called while playing but could not determine playing track'
          );
        }
      } else {
        console.log('spinbox: hide called while not playing');
      }
    }
  });
}

/** --------------------
 *    INITIALIZATION
 *----------------------- */

const init = async () => {
  await spinboxStorage.initialLoad();
  setupContentMutationObserver();
  setupKeyboardShortcuts();
};

init();
