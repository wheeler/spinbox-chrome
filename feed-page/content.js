console.log('spinbox loading');

window.spinbox = window.spinbox || {};

const storageLoadingPromise = chrome.storage.local.get('hiddenTracks');

async function hideSoundListElement(info, element) {
  spinbox.hiddenTracks[info.trackHref] = info;
  await chrome.storage.local.set({ hiddenTracks: spinbox.hiddenTracks });
  element.classList.add('spinbox-hidden');
  updateHiddenTracksDescription();
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

function scanCurrentFeed() {
  const soundListItems = spinbox.getVisibleSoundListElements();
  soundListItems.forEach((item) => {
    const info = getSoundListElementInfo(item);
    if (spinbox.hiddenTracks[info.trackHref]) {
      item.classList.add('spinbox-hidden');
    }
  });

  addButtonsToSoundListElements(soundListItems);
}

function addButtonsToSoundListElements(soundListElements) {
  soundListElements.forEach((element) => {
    const contextElement = element.querySelector('div.soundContext');
    if (contextElement) {
      const info = getSoundListElementInfo(element);
      const button = document.createElement('button');
      button.className = 'sc-button sc-button-medium sc-button-secondary';
      button.style.marginLeft = 'auto';
      button.innerText = 'X';
      button.onclick = () =>
        hideSoundListElement(
          info,
          contextElement.closest('li.soundList__item')
        );
      // TODO: may need to trigger loading more!
      contextElement.appendChild(button);
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

async function resetHiddenTracks() {
  console.log('resetting hidden tracks');
  await chrome.storage.local.set({ hiddenTracks: {} });
  spinbox.hiddenTracks = {};
  console.log('did it work?');

  // TODO: send message to popup script to reset hidden tracks
  updateHiddenTracksDescription();

  const soundListItems = spinbox.getHiddenSoundListElements();
  soundListItems.forEach((item) => {
    item.classList.remove('spinbox-hidden');
  });
}

function createSidebarElement() {
  const spinboxSidebar = document.createElement('article');
  spinboxSidebar.className = 'sidebarModule';

  const title = document.createElement('h4');
  title.textContent = 'spinbox Extension';
  title.className = 'sidebarHeader__title__webi__style';
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

  const resetButton = document.createElement('button');
  resetButton.id = 'hiddenTracksResetButton';
  resetButton.className = 'sc-button sc-button-medium sc-button-secondary';
  resetButton.style.padding = '8px 16px';
  resetButton.innerText = 'Reset hidden tracks';
  resetButton.onclick = resetHiddenTracks;
  content.appendChild(resetButton);

  spinboxSidebar.appendChild(content);
  return spinboxSidebar;
}

function setupMutationObserver() {
  // Select the node that will be observed for mutations
  const targetNode = document.querySelector(
    '.stream__list .lazyLoadingList__list'
  );

  if (!targetNode) {
    console.error('Target node not found for MutationObserver.');
    return;
  }

  // Options for the observer (which mutations to observe)
  const config = { attributes: false, childList: true, subtree: false };

  // Callback function to execute when mutations are observed
  const callback = (mutationList, _observer) => {
    const addedSoundListItems = [];
    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {
        console.log('A child node has been added or removed.', mutation);
        addedSoundListItems.push(...mutation.addedNodes);
      }
    }
    addButtonsToSoundListElements(addedSoundListItems);
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);
}

async function loadPlugin() {
  setupMutationObserver();

  // <div className="stream__header g-flex-row-centered-spread sc-mb-2x">
  // const streamHeader = document.querySelector('div.stream__header');
  // <div class="l-sidebar-right">
  //   <div class="streamSidebar ...
  const streamSidebar = document.querySelector('div.streamSidebar');
  spinbox.sidebarElement = createSidebarElement();
  streamSidebar.prepend(spinbox.sidebarElement);

  // streamSidebar.style.display = 'none';
  // const layoutContainer = document.querySelector('div.l-fluid-fixed');
  // layoutContainer.classList.remove("l-fluid-fixed");
  // layoutContainer.style["padding-right"] = '10px';
  // trigger the re-render of the re-sized players (they look chunky otherwise)
  // setTimeout(() => window.dispatchEvent(new Event('resize')), 1000);

  spinbox.hiddenTracks = {};
  spinbox.hiddenTracks = (await storageLoadingPromise).hiddenTracks || {};
  console.log('loaded with spinbox.hiddenTracks', spinbox.hiddenTracks);
  updateHiddenTracksDescription();

  scanCurrentFeed();
}

const loadingTimer = setInterval(() => {
  const soundListItems = document.querySelectorAll('li.soundList__item');
  if (soundListItems) {
    clearInterval(loadingTimer);
    loadPlugin();
  }
}, 1000);

const userTimer = setInterval(() => {
  const userIdInput = document.getElementById('spinboxSCUserId');
  if (userIdInput) {
    clearInterval(userTimer);
    spinbox.scUserId = userIdInput.value;
  }
}, 1000);
