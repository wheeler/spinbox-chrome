console.log('spinbox loading');

window.spinbox = window.spinbox || {};

const storageLoadingPromise = chrome.storage.local.get('hiddenTracks');
const settingsPromise = chrome.storage.local.get('digSettings');

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

function manuallyAddTrackToPlaylist(element) {
  const mutationObserverCallback = (mutations, observer) => {
    for (const mutation of mutations) {
      if (
        mutation.type === 'childList' &&
        mutation.target.classList.contains('lazyLoadingList__list')
      ) {
        mutation.addedNodes.forEach((node) => {
          if (node.classList && node.classList.contains('soundList__item')) {
            console.log('foo');
          }
        });
      }
    }
  };

  const observer = new MutationObserver((mutations, obs) => {
    const targetPlaylistImage = document.querySelector(
      'a.addToPlaylistItem__image[title="Dig 2025H2"]'
    );
    console.log(mutations);
    if (targetPlaylistImage) {
      console.log('stop mutation observer');
      obs.disconnect();
      const playlistButton = targetPlaylistImage.parentElement.querySelector(
        'button.addToPlaylistButton'
      );
      if (playlistButton.textContent !== 'Added') {
        playlistButton.click();
      } else {
        console.warn('Track had been already added to playlist');
      }
      // document.querySelector('button.modal__closeButton').click();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  element.querySelector('.sc-button-more').click();
  document.querySelector('.moreActions .sc-button-addtoset').click();
  // const targetPlaylistImage = document.querySelector(
  //   'a.addToPlaylistItem__image[title="Dig 2025H2"]'
  // );
  // // wait... or set up mutation observer to find this element
  // const playlistButton = targetPlaylistImage.parentElement.querySelector(
  //   'button.addToPlaylistButton'
  // );
  // if (playlistButton.textContent !== 'Added') {
  //   playlistButton.click();
  // } else {
  //   console.warn('Track had been already added to playlist');
  // }
  document.querySelector('button.modal__closeButton').click();
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
      // TODO: actually implement feature flag
      if (spinbox.digSettings.showDig) {
        const digButton = document.createElement('button');
        digButton.className =
          'spinbox-dig sc-button sc-button-medium sc-button-secondary';
        hideButton.style.marginLeft = '4px';
        digButton.innerText = 'X';
        digButton.innerText = 'Dig';
        digButton.onclick = () => {
          console.log('dig track --', info);
          manuallyAddTrackToPlaylist(
            contextElement.closest('li.soundList__item')
          );

          /* the add track api call was not working correctly, so disabling for now
          const fullUrl = `https://soundcloud.com${info.trackHref}`;
          spinbox.scApi.resolve(fullUrl).then((resolvedInfo) => {
            console.log('dig track resolved info', resolvedInfo);
            if (resolvedInfo.kind === 'track') {
              // add track to playlist.
              console.warn(
                "not actually sending add to playlist request because it's broken"
              );

              // spinbox.scApi.addTrackToPlaylist(
              //   resolvedInfo.id,
              //   spinbox.digSettings.playlistId
              // );
            } else {
              console.error('dig resolved info is not a track', resolvedInfo);
            }
          });
          */
        };
        buttons.push(hideButton);
      }

      const hideButton = document.createElement('button');
      hideButton.className =
        'spinbox-hide sc-button sc-button-medium sc-button-secondary';
      hideButton.style.marginLeft = '4px';
      hideButton.innerText = 'X';
      hideButton.onclick = () =>
        hideSoundListElement(
          info,
          contextElement.closest('li.soundList__item')
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
  trackElement.className = 'spinbox-recently-hidden-track';

  const imageContainer = document.createElement('span');
  imageContainer.className = 'spinbox-track-image';
  if (track.imageUrl) {
    imageContainer.style.backgroundImage = `url('${track.imageUrl}')`;
  }
  trackElement.appendChild(imageContainer);

  const undoHideButton = document.createElement('button');
  undoHideButton.className = 'spinbox-undo-hide sc-button sc-button-secondary';
  undoHideButton.innerText = '⟲';

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
    hiddenTracksCount.textContent = `Hidden tracks: ${count}`;
  }
}

function updateRecentlyHiddenTracksDescription(info) {
  const hiddenList = document.getElementById('recentlyHiddenTrackList');
  if (hiddenList) {
    if (info) {
      // we're adding a single new hidden track
      if (hiddenList.childElementCount > 4) {
        hiddenList.removeChild(hiddenList.lastElementChild);
      }
      hiddenList.prepend(createRecentlyHiddenTrackElement(info));
    } else if (spinbox.recentlyHiddenTracks) {
      const tracks = spinbox.recentlyHiddenTracks.map((track) =>
        createRecentlyHiddenTrackElement(track)
      );
      hiddenList.replaceChildren(...tracks);
    }
  }
}

function createSidebarElement() {
  const spinboxSidebar = document.createElement('article');
  spinboxSidebar.className = 'sidebarModule spinbox-sidebar';

  const title = document.createElement('h4');
  title.textContent = 'spinbox Extension';
  title.className = 'sidebarHeader__title__webi__style';
  title.style.padding = '8px 16px';
  spinboxSidebar.appendChild(title);

  const content = document.createElement('div');
  content.className = 'sidebarContent';

  const contentDescription = document.createElement('div');
  contentDescription.style.padding = '8px 16px';
  contentDescription.textContent = 'spinbox is active.';

  const hiddenCount = document.createElement('div');
  hiddenCount.id = 'hiddenTracksCount';
  hiddenCount.style.padding = '8px 16px';
  content.appendChild(hiddenCount);

  const recentlyHidden = document.createElement('div');
  recentlyHidden.id = 'recentlyHiddenTracksContainer';
  recentlyHidden.style.padding = '8px 16px';
  recentlyHidden.innerText = 'Recently hidden';
  content.appendChild(recentlyHidden);
  const recentlyHiddenList = document.createElement('div');
  recentlyHiddenList.id = 'recentlyHiddenTrackList';
  recentlyHidden.appendChild(recentlyHiddenList);

  spinboxSidebar.appendChild(content);
  return spinboxSidebar;
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
      if (mutation.type === 'childList') {
        if (
          mutation.target.id === 'content' &&
          mutation.target.baseURI.endsWith('feed')
        ) {
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

// TODO add listener for the "help" menu and add spinbox hotkey info there

async function loadHiddenTracks() {
  spinbox.hiddenTracks = {};
  spinbox.hiddenTracks = (await storageLoadingPromise).hiddenTracks || {};
  setupRecentlyHiddenTracks(); // TODO: when list is long should we defer this?
  updateHiddenTrackCount();
  updateRecentlyHiddenTracksDescription();
}

async function loadDigSettings() {
  spinbox.digSettings = {};
  spinbox.digSettings = (await settingsPromise).digSettings || {};
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

loadDigSettings();
loadHiddenTracks();
setupMutationObserver();

// userId/API not currently used
/**
moved to mutation observer
const userTimer = setInterval(() => {
  const userIdInput = document.getElementById('spinboxSCUserId');
  if (userIdInput) {
    clearInterval(userTimer);
    spinbox.scUserId = userIdInput.value;
  }
}, 1000);
*/

// TODO: complete these keybindings
/**
document.addEventListener('keydown', (event) => {
  if (event.key === 'x') {
    if (spinbox.scPlayer.isPlaying()) {
      console.log('spinbox: this will hide the current track');
      // identify playing track
      // move to next track
      // spinbox.scPlayer.playNext();
      // hide playing track
    } else {
      console.log('spinbox: hide called while not playing');
    }
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'd') {
    if (spinbox.scPlayer.isPlaying()) {
      console.log('spinbox: this will dig the current track');
      // identify playing track
      // add playing track to playlist
      // move to next track
      // spinbox.scPlayer.playNext();
      // hide playing track
    } else {
      console.log('spinbox: dig called while not playing');
    }
  }
});
*/
