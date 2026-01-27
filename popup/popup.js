console.log('popup.js loaded');

const resetButton = document.getElementById('hiddenTracksResetButton');

async function loadData() {
  /** api settings currently hidden
  const authPromise = chrome.storage.local.get('auth');
  const authInfo = (await authPromise).auth || {};
  document.getElementById('clientId').value = authInfo.clientId || '';
  document.getElementById('accessToken').value = authInfo.accessToken || '';
  document.getElementById('updateAuth').onclick = () => {
    chrome.storage.local.set({
      auth: {
        clientId: document.getElementById('clientId').value,
        accessToken: document.getElementById('accessToken').value,
      },
    });
  };

  const digSettingsPromise = chrome.storage.local.get('digSettings');
  const digSettings = (await digSettingsPromise).digSettings || {};
  document.getElementById('digPlaylist').value = digSettings.playlistId || '';
  document.getElementById('updateDigSettings').onclick = () => {
    chrome.storage.local.set({
      digSettings: {
        playlistId: document.getElementById('digPlaylist').value,
      },
    });
  };
  */

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

// CORS prevents access to the SoundCloud API from the popup directly, so we need to use the background script or a content script to handle API requests.

/** api settings currently hidden
// Information modal
document.getElementById('showCredentialsHelp').addEventListener('click', () => {
  document.getElementById('credentialsHelp').classList.add('visible');
});

document
  .getElementById('closeCredentialsHelp')
  .addEventListener('click', () => {
    document.getElementById('credentialsHelp').classList.remove('visible');
  });

// Close modal when clicking outside
document.getElementById('credentialsHelp').addEventListener('click', (e) => {
  if (e.target.id === 'credentialsHelp') {
    e.target.classList.remove('visible');
  }
});
*/
