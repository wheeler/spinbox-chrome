// trick the page into loading more tracks by simulating a scroll event
export function forceLoadingMoreTracks() {
  const scrollEvent = new Event('scroll');
  window.dispatchEvent(scrollEvent);
}
