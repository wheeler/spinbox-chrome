console.log('popup.js loaded');

const resetButton = document.getElementById('hiddenTracksResetButton');

async function loadData() {
  const storageLoadingPromise = chrome.storage.local.get('hiddenTracks');
  const hiddenTracks = (await storageLoadingPromise).hiddenTracks || {};

  console.log('Loaded hidden tracks:', hiddenTracks);
  const hiddenTrackCount = Object.keys(hiddenTracks).length;
  const hiddenTracksCount = document.getElementById('hiddenTracksCount');
  hiddenTracksCount.textContent = hiddenTrackCount.toString();
  resetButton.style.display = hiddenTrackCount === 0 ? 'none' : 'inline-block';
  console.log(resetButton, resetButton.style.display, 'resetButton display');
}

async function resetHiddenTracks() {
  await chrome.storage.local.set({ hiddenTracks: {} });
  loadData();
  // TODO: send message to content script to reset hidden tracks
}

resetButton.onclick = resetHiddenTracks;

loadData();

// resetButton.id = 'hiddenTracksResetButton';
// resetButton.className = "sc-button sc-button-medium sc-button-secondary";
// resetButton.style.padding = "8px 16px";
// resetButton.innerText = 'Reset hidden tracks';
// resetButton.onclick = spinbox.resetHiddenTracks;
// content.appendChild(resetButton);
