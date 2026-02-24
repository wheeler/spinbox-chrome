// from content.js

// userId/API not currently used
const userTimer = setInterval(() => {
  const userIdInput = document.getElementById('spinboxSCUserId');
  if (userIdInput) {
    clearInterval(userTimer);
    spinbox.scUserId = userIdInput.value;
  }
}, 1000);

// TODO: complete these keybindings
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

// from popup.js - use credentials for using the API (so far was unstable, buggy)

// popup - loadData()
// api settings currently hidden
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

// popup credentials element actions
// SC credentials settings information
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

// CORS prevents access to the SoundCloud API from the popup directly, so we need to use the background script or a content script to handle API requests.
