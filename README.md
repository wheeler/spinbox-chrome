# spinbox Chrome Extension

## Overview

Supercharge the SoundCloud feed to dig for music faster.

## Design Specification

Keep a list of tracks that have already been played, and hide them from the feed.

When tracks start to load on the page, check if they are played tracks and hide them if not.

Wait for tracks to load
Get a list of the tracks on the page
Walk through list
For each track in the "already played" database, add a class to hide the track

- using a class means the hide-unhide can be done very quickly(?)

detect when a track is played
when the next track is played mark the previous track as played in the db and hide it

# Spin cloud

## Outline

- Index of keys to skip time
- Show a block that indicates hidden tracks
- First pass, add a hide button
- Second pass, automatically hide on next play
- Make sure to handle these cases: track ends, shift arrow, click to another track
- Add a move to dig button
- Allow dig playlist configuration (or auto- create?)
  -100 cap?
  -multi-crate support?
- Add a skip button don’t hide action
- Allow to setup a dig playlist
- On playlist show a move to have playlist button
- Hide tracks already liked or already in playlists
- Have a side bar that shows what you have skipped this session (does it require an additional storage?)

## Spikes to understand the code:

- Write to storage array/collection
- Read from storage array/collection
- we can call playlist assignment
- Test the mutation listener
- We can detect when new elements are added
- When we remove all/many elements the page loads more (or do we have to do something to trigger)
- We can Find the session id and auth keys in page source if needed for playlist manipulation.
- (Late: are there performance problems as the amount of hidden elements gets long? Should we delete them from the dom at some point and suggest refresh to
