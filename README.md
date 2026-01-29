# Spinbox \[Chrome Extension\]

## Overview

Use the SoundCloud feed as an Inbox to dig for music faster.

## Specification

Operate only on the "Feed" page.

Allow users to hide tracks from their feed (for tracks that have already been listened to / evaluated.)

When tracks load on the page, check if they are played tracks and hide them if not.

When hide action is used on a currently playing track, automatically start playing the next track.

Disable the expand-and-contract behavior of tracks with "visuals" (background image) - it reduces visual layout predictability

## Outline

- ~~Index of keys to skip time~~
- ~~Show a block that indicates hidden tracks(?)~~
- ~~First pass, add a hide button~~
- ~~Add a move to dig button~~
- ~~Allow dig playlist configuration~~ (or auto- create?)
- ~~Have a sidebar that shows recently hidden tracks~~
- make global show-hide configuration
- make "visual" expand-collapse optional
- Dig button - quickly add tracks to a playlist (and hide and next)
  - 100 track limit feature?
  - multi-crate support?
- when there is configuration required prompt configuration
- have some better handling of handle playlists that appear on the feed
- ability to auto-hide long tracks (sets)
- - known issue(ish): when you hide a track, then play the track above it, it will play the hidden track next. It's a bit confusing, but easy to click on the track you want to play.

further future...
- figure out what the heck is going on with the API to see if we can actually manipulate playlists by API
- On playlist show a "move to have" playlist button
- Hide tracks already liked or already in playlists
- [Optional] automatically hide on next play
  - handle these cases: track ends, shift arrow, click to another track (minimum play time?)
  - Add a skip button don’t hide action (not needed??)

## Spikes to understand the code:

- ~~Write to storage array/collection~~
- ~~Read from storage array/collection~~
- ~~we can call playlist assignment~~
- ~~Test the mutation listener~~
- ~~We can detect when new elements are added~~
- ~~When we remove all/many elements, does the page load more? (or do we have to do something to trigger)~~
  - ~~No, it does not automatically load more tracks but when you scroll slightly down it does.~~
- We can Find the session id and auth keys in page source if needed for playlist manipulation.
- Later: are there performance problems as the amount of hidden elements gets long? Should we delete them from the dom at some point and suggest refresh to
