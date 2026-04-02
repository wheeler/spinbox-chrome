// from content.js

// Setup listening
const extensionId = chrome.runtime.id;
chrome.runtime.onMessage.addListener(function (message, sender) {
  if (sender.id === extensionId) {
    console.log('spinbox received extension message', message, sender);
  }
});

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

// TODO add listener for the "help" menu and add spinbox hotkey info there

// from popup.js - send messages to content script

// Notify Tabs
let tabs = await chrome.tabs.query({});
tabs = tabs.filter(
  (tab) => !tab.discarded && !tab.frozen && tab.status === 'complete'
);
// TODO: can I somehow filter to only pages that have had our content_script injected easily?
tabs.forEach((tab) => {
  chrome.tabs.sendMessage(tab.id, 'settings_updated', {});
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
