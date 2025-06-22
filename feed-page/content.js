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

  updateHiddenTracksDescription(info);
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

function updateHiddenTracksDescription() {
  const hiddenDescription = document.getElementById('hiddenTracksDescription');
  if (hiddenDescription) {
    const count = Object.keys(spinbox.hiddenTracks).length;
    hiddenDescription.textContent = `Hidden tracks: ${count}`;
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

  const hiddenDescription = document.createElement('div');
  hiddenDescription.id = 'hiddenTracksDescription';
  hiddenDescription.style.padding = '8px 16px';
  content.appendChild(hiddenDescription);

  const recentlyHidden = document.createElement('div');
  recentlyHidden.id = 'recentlyHiddenTracks';
  recentlyHidden.style.padding = '8px 16px';
  recentlyHidden.innerText = 'Recently hidden tracks:';
  content.appendChild(recentlyHidden);
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
  updateHiddenTracksDescription();
}

async function loadDigSettings() {
  spinbox.digSettings = {};
  spinbox.digSettings = (await settingsPromise).digSettings || {};
  // console.log('loaded with spinbox.digSettings', spinbox.digSettings);
}

function setupRecentlyHiddenTracks() {
  spinbox.recentlyHiddenTracks = [];
  // TODO: determine recent hidden tracks
}

// INIT
loadDigSettings();
loadHiddenTracks();
setupMutationObserver();
setupRecentlyHiddenTracks();

// TODO: move to mutation observer (?)
const sidebarTimer = setInterval(() => {
  const sidebarElement = document.querySelector('div.streamSidebar');
  if (sidebarElement) {
    clearInterval(sidebarTimer);
    spinbox.sidebarElement = createSidebarElement();
    sidebarElement.prepend(spinbox.sidebarElement);
    updateHiddenTracksDescription();
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
