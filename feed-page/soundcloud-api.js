window.spinbox = window.spinbox || {};

spinbox.scApi = {};

let auth = null;

const authPromise = chrome.storage.local.get('auth');
const getAuth = async () => {
  const authResponse = await authPromise;
  auth = authResponse.auth || null;
};
getAuth();

spinbox.scApi.getPlaylists = async function (userId) {
  if (auth) {
    const response = await fetch(
      `https://api-v2.soundcloud.com/users/${userId}/playlists?client_id=${auth.clientId}&oauth_token=${auth.accessToken}`
    );
    if (!response.ok) {
      throw new Error(`Error fetching playlists: ${response.statusText}`);
    }
    return response.json();
  }
  // TODO: handle query paging
};
