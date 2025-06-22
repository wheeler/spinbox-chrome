console.log('spinbox loading');

window.spinbox = window.spinbox || {};

const storageLoadingPromise = chrome.storage.local.get('hiddenTracks');
const settingsPromise = chrome.storage.local.get('digSettings');

async function hideSoundListElement(info, element) {
  spinbox.hiddenTracks[info.trackHref] = {
    ...info,
    hiddenAt: new Date().toISOString(),
    hiddenAtTs: Date.now(),
  };
  await chrome.storage.local.set({ hiddenTracks: spinbox.hiddenTracks });
  element.classList.add('spinbox-hidden');
  // TODO: may need to trigger loading more!

  // move to next track if playing. TODO: test more to make sure it's working.
  const isPlaying = element
    .querySelector('div.sound.streamContext')
    .classList.contains('playing');
  if (isPlaying) {
    spinbox.scPlayer.playNext(element);
  }

  updateHiddenTrackCount();
  updateRecentlyHiddenTracksDescription(info);
}

function getSoundListElementInfo(element) {
  let artistName, artistHref, trackName, trackHref;
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
  return { artistName, artistHref, trackName, trackHref };
}

function processNewSoundListElements(soundListElements) {
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
    }

    // add buttons
    const contextElement = element.querySelector('div.soundContext');
    if (contextElement) {
      const digButton = document.createElement('button');
      digButton.className =
        'spinbox-dig sc-button sc-button-medium sc-button-secondary';
      digButton.style.marginLeft = 'auto';
      digButton.innerText = 'X';
      digButton.innerText = 'Dig';
      digButton.onclick = () => {
        const fullUrl = `https://soundcloud.com${info.trackHref}`;
        console.log('dig track -- 2098681506', info);
        spinbox.scApi.resolve(fullUrl).then((resolvedInfo) => {
          console.log('dig track resolved info', resolvedInfo);
          if (resolvedInfo.kind === 'track') {
            // add track to playlist.
            spinbox.scApi.addTrackToPlaylist(
              resolvedInfo.id,
              spinbox.digSettings.playlistId
            );
          } else {
            console.error('dig resolved info is not a track', resolvedInfo);
          }
        });
      };
      contextElement.appendChild(digButton);

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
      contextElement.appendChild(hideButton);
    }
  });
}

function createRecentlyHiddenTrackElement(track) {
  const trackElement = document.createElement('li');
  trackElement.className = 'spinbox-recently-hidden-track';
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
    updateRecentlyHiddenTracksDescription();
  };

  const hiddenTrackDescription = document.createElement('div');
  hiddenTrackDescription.className = 'spinbox-hidden-track-description';
  const hiddenTrackDescriptionArtist = document.createElement('div');
  hiddenTrackDescriptionArtist.className =
    'spinbox-hidden-track-description-artist';
  hiddenTrackDescriptionArtist.innerText = track.artistName;
  const hiddenTrackDescriptionTrack = document.createElement('div');
  hiddenTrackDescriptionTrack.className =
    'spinbox-hidden-track-description-track';
  hiddenTrackDescriptionTrack.innerText = track.trackName;
  hiddenTrackDescription.appendChild(hiddenTrackDescriptionArtist);
  hiddenTrackDescription.appendChild(hiddenTrackDescriptionTrack);

  trackElement.appendChild(undoHideButton);
  trackElement.appendChild(hiddenTrackDescription);

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
  recentlyHidden.innerText = 'Recently hidden tracks:';
  content.appendChild(recentlyHidden);
  const recentlyHiddenList = document.createElement('div');
  recentlyHiddenList.id = 'recentlyHiddenTrackList';
  recentlyHidden.appendChild(recentlyHiddenList);
  console.log(spinbox.hiddenTracks);

  spinboxSidebar.appendChild(content);
  return spinboxSidebar;
}

function setupMutationObserver() {
  // This would get very specific, but if the app is not starting on the feed page, it won't find them when navigating to the feed page.
  // const targetNode = document.querySelector('.stream__list .lazyLoadingList__list');

  // Select the node that will be observed for mutations
  const targetNode = document.getElementById('app');

  if (!targetNode) {
    console.error('Target node not found for MutationObserver.');
    return;
  }

  // Callback function to execute when mutations are observed
  const callback = (mutationList, _observer) => {
    const addedSoundListItems = [];
    for (const mutation of mutationList) {
      if (
        mutation.type === 'childList' &&
        mutation.target.classList.contains('lazyLoadingList__list')
      ) {
        mutation.addedNodes.forEach((node) => {
          if (node.classList && node.classList.contains('soundList__item')) {
            addedSoundListItems.push(node);
          }
        });
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
  observer.observe(targetNode, observerConfig);
}

// TODO add listener for the "help" menu and add spinbox hotkey info there

async function loadHiddenTracks() {
  spinbox.hiddenTracks = {};
  spinbox.hiddenTracks = (await storageLoadingPromise).hiddenTracks || {};
  // console.log('loaded with spinbox.hiddenTracks', spinbox.hiddenTracks);
  setupRecentlyHiddenTracks(); // TODO: when list is long should we defer this?
  updateHiddenTrackCount();
  updateRecentlyHiddenTracksDescription();
}

async function loadDigSettings() {
  spinbox.digSettings = {};
  spinbox.digSettings = (await settingsPromise).digSettings || {};
  // console.log('loaded with spinbox.digSettings', spinbox.digSettings);
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

// INIT
loadDigSettings();
loadHiddenTracks();
setupMutationObserver();

// TODO: move to mutation observer (?)
const sidebarTimer = setInterval(() => {
  const sidebarElement = document.querySelector('div.streamSidebar');
  if (sidebarElement) {
    clearInterval(sidebarTimer);
    spinbox.sidebarElement = createSidebarElement();
    sidebarElement.prepend(spinbox.sidebarElement);
    updateHiddenTrackCount();
    updateRecentlyHiddenTracksDescription();
  }
}, 1000);

// TODO: move to mutation observer (?)
const userTimer = setInterval(() => {
  const userIdInput = document.getElementById('spinboxSCUserId');
  if (userIdInput) {
    clearInterval(userTimer);
    spinbox.scUserId = userIdInput.value;
  }
}, 1000);

document.addEventListener('keydown', (event) => {
  console.log('content keydown event', event);
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
