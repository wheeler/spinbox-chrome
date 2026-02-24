console.log('popup.js loaded');

const resetButton = document.getElementById('hiddenTracksResetButton');

async function loadData() {
  // Load 'Disable visual track expand collapse' setting
  const settingPromise = chrome.storage.local.get('settings');
  const settings = (await settingPromise).settings || {};
  const overrideSetting = settings.overrideDisableVisualExpand || false;
  const disableToggle = document.getElementById('disableVisualExpand');
  if (disableToggle) {
    disableToggle.checked = !overrideSetting;
    disableToggle.addEventListener('change', async () => {
      const val = disableToggle.checked;
      document.getElementById('pageRefreshWarning').style.display = 'block';
      await chrome.storage.local.set({
        settings: { overrideDisableVisualExpand: !val },
      });
    });
  }

  const storageLoadingPromise = chrome.storage.local.get('hiddenTracks');
  const hiddenTracks = (await storageLoadingPromise).hiddenTracks || {};

  const hiddenTrackCount = Object.keys(hiddenTracks).length;
  const hiddenTracksCount = document.getElementById('hiddenTracksCount');
  hiddenTracksCount.textContent = hiddenTrackCount.toString();
  resetButton.style.display = hiddenTrackCount === 0 ? 'none' : 'inline-block';
}

async function resetHiddenTracks() {
  await chrome.storage.local.set({ hiddenTracks: {} });
  loadData();
  // TODO: send message to content script to reset hidden tracks
}

resetButton.onclick = resetHiddenTracks;

loadData();


// Information modals
document
  .getElementById('showVisualExpandInfo')
  .addEventListener('click', () => {
    document.getElementById('visualExpandHelp').classList.add('visible');
  });

document
  .getElementById('closeVisualExpandHelp')
  .addEventListener('click', () => {
    document.getElementById('visualExpandHelp').classList.remove('visible');
  });

// Close modal when clicking outside
document.getElementById('visualExpandHelp').addEventListener('click', (e) => {
  if (e.target.id === 'visualExpandHelp') {
    e.target.classList.remove('visible');
  }
});

