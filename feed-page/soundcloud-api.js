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

spinbox.scApi.getPlaylist = async function (playlistId) {
  if (auth) {
    const response = await fetch(
      `https://api-v2.soundcloud.com/playlists/${playlistId}?client_id=${auth.clientId}&oauth_token=${auth.accessToken}`
    );
    if (!response.ok) {
      throw new Error(`Error fetching playlist: ${response.statusText}`);
    }
    return response.json();
  }
};

spinbox.scApi.resolve = async function (url) {
  if (auth) {
    const response = await fetch(
      `https://api-v2.soundcloud.com/resolve?url=${url}&client_id=${auth.clientId}&oauth_token=${auth.accessToken}`
    );
    if (!response.ok) {
      throw new Error(`Error resolving: ${response.statusText}`);
    }
    return response.json();
  }
};

const delay = (durationMs) => {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
};

spinbox.scApi.addTrackToPlaylist = async function (
  trackId,
  playlistId,
  allowDuplicates = false
) {
  if (auth) {
    const playlist = await spinbox.scApi.getPlaylist(playlistId);
    console.log('playlist', playlist);
    // get tracks from playlist
    const prevTracks = playlist.tracks.map((t) => t.id) || [];

    // if the track already exists in the playlist, and allowDuplicates is false, skip
    if (!allowDuplicates && prevTracks.includes(trackId)) {
      console.log(`Track ${trackId} already exists in playlist ${playlistId}`);
      return null;
    }

    const newTracks = [...prevTracks, trackId];

    console.log('adding tracks', newTracks);

    await delay(100); // TODO: not needed?

    // PUT the playlist with new track list

    // TODO: this is getting CAPTCHA'd !!!
    // const response = await fetch(
    //   `https://api-v2.soundcloud.com/playlists/${playlistId}?client_id=${auth.clientId}&app_version=1749738053&app_locale=en`,
    //   {
    //     method: 'PUT',
    //     headers: {
    //       accept: 'application/json, text/javascript, */*; q=0.01',
    //       authorization: `OAuth ${auth.accessToken}`,
    //       // 'cache-control': 'no-cache',
    //       // 'content-type': 'application/json',
    //       // pragma: 'no-cache',
    //     },
    //     body: JSON.stringify({ playlist: { tracks: newTracks } }),
    //     // mode: 'cors',
    //     // referrer: 'https://soundcloud.com/',
    //     // referrerPolicy: 'origin',
    //     // credentials: 'include',
    //   }
    // );

    // NOTE: this works... but the app's understanding of the playlist is out of date.
    const response = await fetch(
      `https://api-v2.soundcloud.com/playlists/${playlistId}?client_id=${auth.clientId}&app_version=1749738053&app_locale=en`,
      {
        headers: {
          accept: 'application/json, text/javascript, */*; q=0.01',
          'accept-language': 'en-US,en;q=0.9',
          authorization: `OAuth ${auth.accessToken}`,
          'content-type': 'application/json',
          // 'sec-ch-ua':
          //   '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
          // 'sec-ch-ua-mobile': '?0',
          // 'sec-ch-ua-platform': '"macOS"',
          // 'sec-fetch-dest': 'empty',
          // 'sec-fetch-mode': 'cors',
          // 'sec-fetch-site': 'same-site',
          // 'x-datadome-clientid':
          //   'V0LXFTqMmyXQPS6Zdf3wkyDPu7PZ9vs3t2ejP1IenPwgL0PvZdzsVJNd~QYUwzhphauPAGT~kzVYHJxxnsgqNKiyyank~WCPuBq3ke2xKAeJXQDbclMFEWREVW246cvb',
        },
        referrer: 'https://soundcloud.com/',
        referrerPolicy: 'origin',
        body: '{"playlist":{"tracks":[1962407595,1518333106]}}',
        method: 'PUT',
        mode: 'cors',
        credentials: 'include',
      }
    );

    // "accept-language": "en-US,en;q=0.9",
    // "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
    // "sec-ch-ua-mobile": "?0",
    // "sec-ch-ua-platform": "\"macOS\"",
    // "sec-fetch-dest": "empty",
    // "sec-fetch-mode": "cors",
    // "sec-fetch-site": "same-site",
    // "x-datadome-clientid": "NNTU1oQnf1XkWX8e~V4ZIfpy1qC5n_785WJdTpNu7qSwRfAaMgP62HolrtGMY8KPceuKgQbfjC3dEid75TI9t8_zP_lF3vU0WwNkU98GSJ6oxSsVedp0KPL3uO0QaLby"
    // "referrer": "https://soundcloud.com/",
    // "referrerPolicy": "origin",
    // "body": "{\"playlist\":{\"tracks\":[1962407595,2098681506]}}",
    // "method": "PUT",
    // "mode": "cors",
    // "credentials": "include"
    // });

    if (!response.ok) {
      throw new Error(`Error adding track to playlist: ${response.statusText}`);
    }
    return response.json();
  }
};
