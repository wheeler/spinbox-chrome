import { getRecentElementsFromArray } from './data-helpers.js';

class SpinboxStorage {
  settings = {};
  hiddenTracks = {};
  recentlyHiddenTracks = [];

  async initialLoad() {
    const loadingPromises = [this.#fetchHiddenTracks(), this.#fetchSettings()];
    await Promise.all(loadingPromises);
    this.#initializeRecentlyHiddenTracks(); // todo: if list is long should we defer/background this?
  }

  #initializeRecentlyHiddenTracks() {
    this.recentlyHiddenTracks = getRecentElementsFromArray(
      Object.values(this.hiddenTracks),
      'hiddenAtTs',
      5
    );
  }

  trackIsHidden(trackHref) {
    return !!this.hiddenTracks[trackHref];
  }

  hiddenTrackCount() {
    return Object.keys(this.hiddenTracks).length;
  }

  async hideTrack(trackInfo) {
    this.hiddenTracks[trackInfo.trackHref] = {
      ...trackInfo,
      hiddenAt: new Date().toISOString(),
      hiddenAtTs: Date.now(),
    };
    await this.#pushHiddenTracks();

    this.recentlyHiddenTracks.unshift(trackInfo);
    if (this.recentlyHiddenTracks.length > 5) this.recentlyHiddenTracks.pop();
  }

  async unhideTrack(trackHref) {
    delete this.hiddenTracks[trackHref];
    await this.#pushHiddenTracks();

    // needed to find the now nth recently hidden track
    this.#initializeRecentlyHiddenTracks();
  }

  async #pushHiddenTracks() {
    await chrome.storage.local.set({ hiddenTracks: this.hiddenTracks });
  }

  async #fetchHiddenTracks() {
    this.hiddenTracks =
      (await chrome.storage.local.get('hiddenTracks')).hiddenTracks || {};
  }

  async #fetchSettings() {
    this.settings = (await chrome.storage.local.get('settings')).settings || {};
  }
}

// create and export singleton
export default SpinboxStorage;
