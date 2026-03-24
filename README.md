# Spinbox Chrome Extension

[![Spinbox in Chrome Web Store](/.github/images/chrome_webstore_badge.png)](https://chromewebstore.google.com/detail/spinbox/dlkonbbcmbokjmoanilgbhapldalhohk)

Use the SoundCloud feed as a music inbox. Dig for music faster and with less repetition.

![Screenshot of the SoundCloud feed with the SpinBox Extension active](/.github/images/spinbox_screenshot.png)

SoundCloud is a fantastic platform for music discovery, allowing you to follow artists and see new music they release.
The feed page shows all your "followed" artists tracks in chronological order. This is a great tool for music discovery,
but has the downside that you cannot "pick up where you left off" if you return to the feed later. This extension
allows you to persistently hide tracks from your feed so you won't have to sift through them all over again.

## Description

Allow users to persistently hide tracks from their feed. Adds a hide button to each track and adds details about
hidden tracks to the sidebar. When the currently playing track is hidden, automatically start playing the next track.

Example workflow: Go through your feed, hide tracks that you don't like. For tracks that you do like, either heart them
or add them to a playlist then hide them. This way all tracks that you've already been "digging" through will not appear
on your next visit to the feed, and you can pick up where you left off (after any newer tracks have been added to the
top).

Currently only operates on the `/feed` page. Does not modify anything else like the `/artist` page, "playlist" pages
(`/artist/sets/playlist`), etc.

### Additional Quality of Life features:

Disables the expand-and-contract behavior of tracks with "visuals" (background image). Disabling it increases page
layout stability (for example, if you want to go directly to the middle of the next track by clicking the middle of the
waveform twice). This feature is optional and can be disabled in the extension settings window.

### Privacy

This extension works completely internally in the browser. All data is stored in the browser's extension storage. <ins>
No data is communicated or stored externally.</ins>

### Open Source

Open source (GPLv3). Source code is hosted on GitHub at https://github.com/wheeler/spinbox-chrome

### Known quirks / issues:

- Playlists and albums on the feed are handled as one whole unit to hide instead of individual tracks.
- Hidden tracks can still be played in the SoundCloud UI. Example: if you hide a playing track and the next track is
  already hidden, that hidden track will play, which is a bit of a confusing experience. The player in the footer behaves
  normally and shows the playing track even if it is hidden. The user can simply click another track to play it.

## Planned Features

- "Dig" button – quickly add tracks to a playlist (and hide and move on to the next one)
- Global Show / Hide toggle
- Hotkey operation for hide and dig
- Some visual representation for blocks of hidden tracks
- Optional feature to auto-hide tracks above a certain length
- Improve handling of playlists / albums that appear in the feed

### further future...

- Use the SC API to manipulate playlists instead of faking user clicks.
  - Unfortunately, Soundcloud does not fully support either of their public APIs (v1 and v2) nor do they fully document
    them, so it has been challenging to implement so far.
- Allow configuration more easily either within the sidebar or opening a configuration page instead of the extension
  popup (which is relatively hidden to most users).
- Prompt the user in the page when configuration is necessary.
- Multiple dig-playlists (crates)
- Auto create dig playlist?
- Auto 100-track limit for playlists?
- Mute specific artists
- Playlist management features: move tracks between playlists quickly.
- Option to hide tracks already liked or already in playlists.
- Optional Turbo mode(?)
  - Automatically hide every played track when the next track is played.
  - Handle these cases: track ends, shift arrow, click to another track (minimum playtime?)
  - Add a skip / don’t hide action
