console.log('spinbox loading');

window.spinbox = window.spinbox || { settings: {}, digSettings: {} };

const storageLoadingPromise = chrome.storage.local.get('hiddenTracks');
const digSettingsPromise = chrome.storage.local.get('digSettings');
const settingsPromise = chrome.storage.local.get('settings');

const repostSVG = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.08034 5.71966L4.05001 2.68933L1.01968 5.71966L2.08034 6.78032L3.30002 5.56065V9.75C3.30002 11.2688 4.53124 12.5 6.05002 12.5H8.05002V11H6.05002C5.35966 11 4.80002 10.4404 4.80002 9.75V5.56066L6.01968 6.78032L7.08034 5.71966Z" fill="currentColor"></path><path d="M11.95 13.3107L8.91969 10.2803L9.98035 9.21968L11.2 10.4393L11.2 5.75C11.2 5.05964 10.6404 4.5 9.95001 4.5L7.95001 4.5L7.95001 3L9.95001 3C11.4688 3 12.7 4.23122 12.7 5.75L12.7 10.4394L13.9197 9.21968L14.9803 10.2803L11.95 13.3107Z" fill="currentColor"></path></svg>`;
function getRepostSvg() {
  const template = document.createElement('template');
  template.innerHTML = repostSVG;
  return template.content.firstElementChild;
}

// trick the page into loading more tracks by simulating a scroll event
function forceLoadingMoreTracks() {
  const scrollEvent = new Event('scroll');
  window.dispatchEvent(scrollEvent);
}

async function hideSoundListElement(info, element) {
  spinbox.hiddenTracks[info.trackHref] = {
    ...info,
    hiddenAt: new Date().toISOString(),
    hiddenAtTs: Date.now(),
  };
  await chrome.storage.local.set({ hiddenTracks: spinbox.hiddenTracks });
  element.classList.add('spinbox-hidden');

  // move to next track if playing. TODO: test more to make sure it's working.
  const isPlaying = element
    .querySelector('div.sound.streamContext')
    .classList.contains('playing');
  if (isPlaying) {
    spinbox.scPlayer.playNext(element);
  }

  forceLoadingMoreTracks();

  updateHiddenTrackCount();
  updateRecentlyHiddenTracksDescription(info);
}

function getSoundListElementInfo(element) {
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

  const imageElement = element.querySelector('span.image__full');
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

    // add buttons
    const contextElement = element.querySelector('div.soundContext');
    const buttons = [];
    if (contextElement) {
      // TODO: add "dig" button

      const hideButton = document.createElement('button');
      hideButton.className =
        'spinbox-hide sc-button sc-button-medium sc-button-secondary';
      hideButton.style.marginLeft = '4px';
      hideButton.innerText = '✕';
      hideButton.onclick = () =>
        hideSoundListElement(
          info,
          contextElement.closest('li.soundList__item')
        );
      hideButton.ariaLabel = 'Hide Track';
      hideButton.title = 'Hide Track';
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
    setupRecentlyHiddenTracks();
    updateHiddenTrackCount();
    updateRecentlyHiddenTracksDescription();
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
    hiddenTrackDescriptionArtist.appendChild(getRepostSvg());
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

function updateHiddenTrackCount() {
  const hiddenTracksCount = document.getElementById('hiddenTracksCount');
  if (hiddenTracksCount) {
    const count = Object.keys(spinbox.hiddenTracks).length;
    hiddenTracksCount.textContent = count.toString();

    const hiddenTracksPlural = document.getElementById('hiddenTracksPlural');
    if (hiddenTracksPlural) {
      if (count === 1) hiddenTracksPlural.textContent = '';
      else hiddenTracksPlural.textContent = 's';
    }
  }
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

function createSidebarElement() {
  const spinboxSidebar = document.createElement('article');
  spinboxSidebar.className = 'sidebarModule spinbox-sidebar';

  const title = document.createElement('h4');
  title.className = 'sidebarHeader__title__webi__style';
  title.style.padding = '8px 16px';
  const hiddenTrackCount = document.createElement('span');
  hiddenTrackCount.id = 'hiddenTracksCount';
  title.appendChild(hiddenTrackCount);
  title.append(' hidden track');
  const hiddenTracksPlural = document.createElement('span');
  hiddenTracksPlural.id = 'hiddenTracksPlural';
  hiddenTracksPlural.textContent = 's';
  title.appendChild(hiddenTracksPlural);
  spinboxSidebar.appendChild(title);

  const content = document.createElement('div');
  content.className = 'sidebarContent';

  const contentDescription = document.createElement('div');
  contentDescription.style.padding = '8px 16px';
  contentDescription.textContent = 'spinbox is active.';

  const recentlyHidden = document.createElement('div');
  recentlyHidden.id = 'recentlyHiddenTracksContainer';
  recentlyHidden.style.padding = '8px 16px';
  const recentlyHiddenTitle = document.createElement('div');
  recentlyHiddenTitle.innerText = 'Recently hidden';
  recentlyHiddenTitle.className =
    'sc-text-secondary sidebarHeader__title__webi__style sc-mb-1x';
  recentlyHidden.appendChild(recentlyHiddenTitle);
  content.appendChild(recentlyHidden);
  const recentlyHiddenList = document.createElement('div');
  recentlyHiddenList.id = 'recentlyHiddenTrackList';
  recentlyHidden.appendChild(recentlyHiddenList);

  spinboxSidebar.appendChild(content);
  return spinboxSidebar;
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
          if (!spinbox.settings.overrideDisableVisualExpand) {
            const streamList = document.querySelector('div.stream__list');
            if (streamList) {
              streamList.classList.add('spinbox-disable-visual-expand');
            }
          }
          const spinboxSidebar = document.querySelector(
            'article.spinbox-sidebar'
          );
          if (!spinboxSidebar) {
            const SCsidebarElement =
              document.querySelector('div.streamSidebar');
            if (!SCsidebarElement) {
              console.log('Spinbox - no sidebar?'); // when can this happen?
            } else {
              spinbox.sidebarElement = createSidebarElement();
              SCsidebarElement.prepend(spinbox.sidebarElement);
              updateHiddenTrackCount();
              updateRecentlyHiddenTracksDescription();
            }
          }
          // check for already loaded but unprocessed nodes - seems to happen on navigation returning to the feed
          const existingSoundListItems = document.querySelectorAll(
            'li.soundList__item:not(.spinbox-processed)'
          );
          if (existingSoundListItems && existingSoundListItems.length)
            addedSoundListItems.push(...existingSoundListItems);
        } else if (
          mutation.target.classList.contains('lazyLoadingList__list') &&
          mutation.target.baseURI.endsWith('feed')
        ) {
          mutation.addedNodes.forEach((node) => {
            if (node.classList && node.classList.contains('soundList__item')) {
              addedSoundListItems.push(node);
            }
          });
        }
      }
    }
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
  updateHiddenTrackCount();
  updateRecentlyHiddenTracksDescription();
}

async function loadSettings() {
  spinbox.digSettings = (await digSettingsPromise).digSettings || {};
  spinbox.settings = (await settingsPromise).settings || {};
}

function setupRecentlyHiddenTracks() {
  spinbox.recentlyHiddenTracks = [];
  let fifthRecentTimestamp = 0;
  Object.values(spinbox.hiddenTracks).forEach((track) => {
    if (track.hiddenAtTs && track.hiddenAtTs > fifthRecentTimestamp) {
      // Find the correct position to insert the track
      const insertIndex = spinbox.recentlyHiddenTracks.findIndex(
        (t) => t.hiddenAtTs < track.hiddenAtTs
      );

      if (insertIndex === -1) {
        // If no earlier timestamp found, append to end
        spinbox.recentlyHiddenTracks.push(track);
      } else {
        // Insert at the correct position
        spinbox.recentlyHiddenTracks.splice(insertIndex, 0, track);
      }

      if (spinbox.recentlyHiddenTracks.length > 5) {
        spinbox.recentlyHiddenTracks.pop(); // keep only the 5 most recent hidden tracks
        fifthRecentTimestamp = spinbox.recentlyHiddenTracks[4].hiddenAtTs;
      }
    }
  });
}

/** --------------------
 *    INITIALIZATION
 *----------------------- */

loadSettings();
loadHiddenTracks();
setupMutationObserver();
