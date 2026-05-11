import SpinboxStorage from '../shared/data-storage.js';

console.log('popup.js loaded');

const spinboxStorage = new SpinboxStorage();

const disableVisualsToggle = document.getElementById('disableVisualExpand');
const pullPlaylistInput = document.getElementById('pullPlaylist');
const updateSettingsButton = document.getElementById('updateSettings');
const resetButton = document.getElementById('hiddenTracksResetButton');
const exportButton = document.getElementById('exportHiddenTracksButton');
const importButton = document.getElementById('importHiddenTracksButton');
const importFileInput = document.getElementById('importHiddenTracksFile');

function setupFormAndFields() {
  const overrideSetting =
    spinboxStorage.settings.overrideDisableVisualExpand || false;
  disableVisualsToggle.checked = !overrideSetting;

  pullPlaylistInput.value = spinboxStorage.settings.pullPlaylist || '';

  const hiddenTrackCount = spinboxStorage.hiddenTrackCount();
  const hiddenTracksCount = document.getElementById('hiddenTracksCount');
  hiddenTracksCount.textContent = hiddenTrackCount.toString();
  resetButton.disabled = hiddenTrackCount === 0;
  exportButton.disabled = hiddenTrackCount === 0;
}

async function resetHiddenTracks() {
  await spinboxStorage.resetHiddenTracks();
  setupFormAndFields();
  // TODO: send message to content script to reset hidden tracks
}

async function exportHiddenTracks() {
  // note: fetching again for the most recent data possible
  await spinboxStorage.initialLoad();

  const dataStr = JSON.stringify(spinboxStorage.hiddenTracks, null, 2);
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

    // note: fetching again for the most recent data possible
    await spinboxStorage.initialLoad();

    await spinboxStorage.mergeHiddenTracks(importedTracks);

    setupFormAndFields();
    // TODO: send message to content script to update hidden tracks
  } catch (error) {
    alert(`Error importing file: ${error.message}`);
  }
}

disableVisualsToggle.addEventListener('change', async (e) => {
  const val = e.target.checked;
  // TODO: notify tabs instead of showing a warning
  document.getElementById('visualExpandPageRefreshWarning').style.display =
    'block';
  await spinboxStorage.updateSettings({
    overrideDisableVisualExpand: !val,
  });
});

pullPlaylistInput.oninput = (event) => {
  const newValue = event.target.value.trim();
  updateSettingsButton.disabled =
    newValue === '' || newValue === spinboxStorage.settings.pullPlaylist;
};

updateSettingsButton.onclick = async (event) => {
  event.target.disabled = true;
  // TODO: notify tabs instead of showing a warning
  document.getElementById('settingsPageRefreshWarning').style.display = 'block';
  await spinboxStorage.updateSettings({
    pullPlaylist: pullPlaylistInput.value.trim(),
  });
};

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

async function init() {
  await spinboxStorage.initialLoad();
  setupFormAndFields();
}

init();
