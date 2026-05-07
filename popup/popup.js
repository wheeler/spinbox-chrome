console.log('popup.js loaded');

const resetButton = document.getElementById('hiddenTracksResetButton');
const exportButton = document.getElementById('exportHiddenTracksButton');
const importButton = document.getElementById('importHiddenTracksButton');
const importFileInput = document.getElementById('importHiddenTracksFile');

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
      // TODO: notify tabs instead of showing a warning
      document.getElementById('visualExpandPageRefreshWarning').style.display =
        'block';
      await chrome.storage.local.set({
        settings: {
          ...settings,
          overrideDisableVisualExpand: !val,
        },
      });
    });
  }

  const updateSettingsButton = document.getElementById('updateSettings');
  const pullPlaylistInput = document.getElementById('pullPlaylist');
  pullPlaylistInput.value = settings.pullPlaylist || '';
  pullPlaylistInput.oninput = (event) => {
    const newValue = event.target.value.trim();
    updateSettingsButton.disabled =
      newValue === '' || newValue === settings.pullPlaylist;
  };

  updateSettingsButton.onclick = async (event) => {
    event.target.disabled = true;
    // TODO: notify tabs instead of showing a warning
    document.getElementById('settingsPageRefreshWarning').style.display =
      'block';
    settings.pullPlaylist = pullPlaylistInput.value.trim();
    await chrome.storage.local.set({
      settings: settings,
    });
  };

  const storageLoadingPromise = chrome.storage.local.get('hiddenTracks');
  const hiddenTracks = (await storageLoadingPromise).hiddenTracks || {};

  const hiddenTrackCount = Object.keys(hiddenTracks).length;
  const hiddenTracksCount = document.getElementById('hiddenTracksCount');
  hiddenTracksCount.textContent = hiddenTrackCount.toString();
  resetButton.disabled = hiddenTrackCount === 0;
  exportButton.disabled = hiddenTrackCount === 0;
}

async function resetHiddenTracks() {
  await chrome.storage.local.set({ hiddenTracks: {} });
  loadData();
  // TODO: send message to content script to reset hidden tracks
}

async function exportHiddenTracks() {
  const storagePromise = chrome.storage.local.get('hiddenTracks');
  const hiddenTracks = (await storagePromise).hiddenTracks || {};

  const dataStr = JSON.stringify(hiddenTracks, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `spinbox-hidden-tracks-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function importHiddenTracks(file) {
  try {
    const text = await file.text();
    const importedTracks = JSON.parse(text);
    if (typeof importedTracks !== 'object' || importedTracks === null) {
      alert('Invalid file format. Expected a JSON object.');
      return;
    }
    // TODO: actually validate import format...

    const storagePromise = chrome.storage.local.get('hiddenTracks');
    const existingTracks = (await storagePromise).hiddenTracks || {};

    const mergedTracks = { ...existingTracks, ...importedTracks };
    await chrome.storage.local.set({ hiddenTracks: mergedTracks });

    loadData();
    // TODO: send message to content script to update hidden tracks
  } catch (error) {
    alert(`Error importing file: ${error.message}`);
  }
}

resetButton.onclick = resetHiddenTracks;
exportButton.onclick = exportHiddenTracks;
importButton.onclick = () => importFileInput.click();
importFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    importHiddenTracks(e.target.files[0]);
    e.target.value = ''; // Reset the input
  }
});

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

loadData();
