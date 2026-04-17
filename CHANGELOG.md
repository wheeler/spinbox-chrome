# Changelog

## [0.1.0] - 2026-04-06

### Added

- Pull Button: quickly add a track to a designated "pull" playlist #6
  - Pull playlist settings in the extension popup
- Small logo and title in sidebar #7

### Changed

- Reduced the number of "recently hidden" tracks shown in sidebar from 5 to 3 #7
- Hidden tracks that are being currently played are now temporarily displayed but faded out #8

### Fixed

- Fixed a bug where occasionally the extension would fail to initialize if the extension initialized later than expected

## [0.0.1] - 2026-03-21

Initial release version

### Added

- Ability to persistently hide tracks on the SoundCloud `/feed` page
- Ability to see and unhide recently hidden tracks in the `/feed` page sidebar
- Automatically play the next track when a currently playing track is hidden
- Option to disable the expand-and-contract behavior of tracks with "visuals" (aka tracks with a background image)
- Ability to export / import hidden tracks in the extension settings popup
