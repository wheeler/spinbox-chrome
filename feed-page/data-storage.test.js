/* global global */
import SpinboxStorage from './data-storage.js';

describe('SpinboxStorage', () => {
  let storage;
  let mockChromeStorage;
  let mockHiddenTracksResult;
  let mockSettingsResult = { overrideDisableVisualExpand: false };

  beforeEach(() => {
    mockHiddenTracksResult = {
      '/ofthetrees/look-into-my-eyes': {
        trackHref: '/ofthetrees/look-into-my-eyes',
        trackName: 'Look Into My Eyes',
        hiddenAtTs: 1773186001000,
      },
      '/phrva/ghost-voices': {
        trackHref: '/phrva/ghost-voices',
        trackName: 'Ghost Voices',
        hiddenAtTs: 1773186003000,
      },
      '/memorypalace/ghoul': {
        trackHref: '/memorypalace/ghoul',
        trackName: 'Ghoul',
        hiddenAtTs: 1773186002000,
      },
    };

    // Create a new instance for each test
    storage = new SpinboxStorage();

    // Create mock functions for chrome.storage.local using jest.fn()
    mockChromeStorage = {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve(undefined)),
    };

    mockChromeStorage.get.mockImplementation((key) => {
      if (key === 'hiddenTracks') {
        return Promise.resolve({ hiddenTracks: mockHiddenTracksResult });
      }
      if (key === 'settings') {
        return Promise.resolve({ settings: mockSettingsResult });
      }
      return Promise.resolve({});
    });

    global.chrome = { storage: { local: mockChromeStorage } };
  });

  describe('constructor and initialization', () => {
    it('initializes with empty state', () => {
      expect(storage.settings).toEqual({});
      expect(storage.hiddenTracks).toEqual({});
      expect(storage.recentlyHiddenTracks).toEqual([]);
    });
  });

  describe('initialLoad', () => {
    it('loads hidden tracks and settings from storage', async () => {
      await storage.initialLoad();

      expect(storage.hiddenTracks).toEqual(mockHiddenTracksResult);
      expect(storage.settings).toEqual(mockSettingsResult);
    });

    it('handles empty storage gracefully', async () => {
      mockChromeStorage.get.mockResolvedValue({});

      await storage.initialLoad();

      expect(storage.hiddenTracks).toEqual({});
      expect(storage.settings).toEqual({});
    });

    it('initializes recently hidden tracks after loading', async () => {
      await storage.initialLoad();

      expect(storage.recentlyHiddenTracks).toHaveLength(3);
      expect(storage.recentlyHiddenTracks.map((t) => t.trackHref)).toEqual([
        '/phrva/ghost-voices',
        '/memorypalace/ghoul',
        '/ofthetrees/look-into-my-eyes',
      ]);
    });

    it('should make concurrent calls to fetch hidden tracks and settings', async () => {
      mockChromeStorage.get.mockResolvedValue({});

      await storage.initialLoad();

      // Both get calls should be made
      expect(mockChromeStorage.get).toHaveBeenCalledWith('hiddenTracks');
      expect(mockChromeStorage.get).toHaveBeenCalledWith('settings');
      expect(mockChromeStorage.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('trackIsHidden', () => {
    it('should return true if track is hidden', () => {
      storage.hiddenTracks = mockHiddenTracksResult;

      expect(storage.trackIsHidden('/ofthetrees/look-into-my-eyes')).toBe(true);
    });

    it('should return false if track is not hidden', () => {
      storage.hiddenTracks = mockHiddenTracksResult;

      expect(storage.trackIsHidden('/phrva/ghost-voices0')).toBe(false);
    });

    it('should return false for empty hiddenTracks', () => {
      storage.hiddenTracks = {};

      expect(storage.trackIsHidden('/ofthetrees/look-into-my-eyes')).toBe(
        false
      );
    });
  });

  describe('hiddenTrackCount', () => {
    it('should return count of hidden tracks', () => {
      storage.hiddenTracks = mockHiddenTracksResult;

      expect(storage.hiddenTrackCount()).toBe(3);
    });

    it('should return 0 when no tracks are hidden', () => {
      storage.hiddenTracks = {};

      expect(storage.hiddenTrackCount()).toBe(0);
    });
  });

  describe('hideTrack', () => {
    it('should add track to hiddenTracks and persist the data', async () => {
      const trackInfo = {
        trackHref: '/ofthetrees/look-into-my-eyes',
        trackName: 'Look Into My Eyes',
        artistName: 'Artist 1',
      };

      const hiddenTrackCount = storage.hiddenTrackCount();
      expect(storage.trackIsHidden('/ofthetrees/look-into-my-eyes')).toBe(
        false
      );
      await storage.hideTrack(trackInfo);
      expect(storage.trackIsHidden('/ofthetrees/look-into-my-eyes')).toBe(true);
      expect(storage.hiddenTrackCount()).toBe(hiddenTrackCount + 1);

      expect(mockChromeStorage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          hiddenTracks: expect.objectContaining({
            '/ofthetrees/look-into-my-eyes': expect.objectContaining({
              trackHref: '/ofthetrees/look-into-my-eyes',
              trackName: 'Look Into My Eyes',
            }),
          }),
        })
      );
    });

    it('should add track to recentlyHiddenTracks at the beginning', async () => {
      await storage.initialLoad();

      expect(storage.recentlyHiddenTracks).toHaveLength(3);

      await storage.hideTrack({
        trackHref: '/flavortown',
        trackName: 'Flavor Town',
      });

      expect(storage.recentlyHiddenTracks).toHaveLength(4);
      expect(storage.recentlyHiddenTracks[0].trackHref).toBe('/flavortown');
    });

    it('should limit recentlyHiddenTracks to 5 items when adding new tracks', async () => {
      for (let i = 1; i <= 7; i++) {
        await storage.hideTrack({
          trackHref: `track-${i}`,
          trackName: `Song ${i}`,
        });
      }

      expect(storage.recentlyHiddenTracks).toHaveLength(5);
      expect(storage.recentlyHiddenTracks[0].trackHref).toBe('track-7');
      expect(storage.recentlyHiddenTracks[4].trackHref).toBe('track-3');
    });
  });

  describe('unhideTrack', () => {
    it('should remove track from hiddenTracks and persist', async () => {
      storage.hiddenTracks = mockHiddenTracksResult;

      expect(storage.trackIsHidden('/ofthetrees/look-into-my-eyes')).toBe(true);
      await storage.unhideTrack('/ofthetrees/look-into-my-eyes');
      expect(storage.trackIsHidden('/ofthetrees/look-into-my-eyes')).toBe(
        false
      );

      expect(mockChromeStorage.set).toHaveBeenCalledWith(
        expect.objectContaining({
          hiddenTracks: expect.objectContaining({}),
        })
      );
    });

    it('should reinitialize recentlyHiddenTracks after unhiding', async () => {
      await storage.initialLoad();

      expect(storage.recentlyHiddenTracks).toHaveLength(3);
      await storage.unhideTrack('/phrva/ghost-voices');
      expect(storage.recentlyHiddenTracks).toHaveLength(2);

      // After reinitializing, /phrva/ghost-voices should be removed from recentlyHiddenTracks
      expect(storage.recentlyHiddenTracks.map((t) => t.trackHref)).toEqual([
        '/memorypalace/ghoul',
        '/ofthetrees/look-into-my-eyes',
      ]);
    });

    it('should handle unhiding a non-existent track', async () => {
      await storage.initialLoad();

      expect(storage.hiddenTrackCount()).toEqual(3);
      expect(storage.recentlyHiddenTracks).toHaveLength(3);
      // should do nothing
      await storage.unhideTrack('track-999');
      expect(storage.hiddenTrackCount()).toEqual(3);
      expect(storage.recentlyHiddenTracks).toHaveLength(3);
    });
  });

  it('should handle a complete workflow: load, hide, unhide, hide again', async () => {
    // Initial load
    await storage.initialLoad();
    expect(storage.hiddenTrackCount()).toBe(3);

    // Hide a track
    await storage.hideTrack({
      trackHref: '/foo/baz',
      trackName: 'The Foo Baz Song',
    });
    expect(storage.hiddenTrackCount()).toBe(4);

    // Unhide a track
    await storage.unhideTrack('/ofthetrees/look-into-my-eyes');
    expect(storage.hiddenTrackCount()).toBe(3);
    expect(storage.trackIsHidden('/ofthetrees/look-into-my-eyes')).toBe(false);
    expect(storage.trackIsHidden('/phrva/ghost-voices')).toBe(true);
    expect(storage.trackIsHidden('/memorypalace/ghoul')).toBe(true);
    expect(storage.trackIsHidden('/foo/baz')).toBe(true);

    expect(storage.recentlyHiddenTracks.map((t) => t.trackHref)).toEqual([
      '/foo/baz',
      '/phrva/ghost-voices',
      '/memorypalace/ghoul',
    ]);

    await storage.hideTrack({
      trackHref: '/ofthetrees/look-into-my-eyes',
      trackName: 'Look Into My Eyes',
    });

    expect(storage.hiddenTrackCount()).toBe(4);
    expect(storage.recentlyHiddenTracks.map((t) => t.trackHref)).toEqual([
      '/ofthetrees/look-into-my-eyes',
      '/foo/baz',
      '/phrva/ghost-voices',
      '/memorypalace/ghoul',
    ]);
  });
});
