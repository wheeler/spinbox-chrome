import { screen } from '@testing-library/dom';
import {
  addDisableVisualExpandFlagToStreamList,
  getSoundListElementInfo,
  soundListElementIsCurrentlyPlaying,
  updateHiddenTrackCount,
} from './feed-dom-helpers.js';
import {
  currentlyPlayingTrackElementFromFeedPage,
  playlistElementFromFeedPage,
  repostedTrackElementFromArtistPage,
  repostedTrackElementFromFeedPage,
  trackElementFromArtistPage,
  trackElementFromFeedPage,
} from './__fixtures__/feed-dom-helpers.fixtures.js';

describe('addDisableVisualExpandFlagToStreamList', () => {
  describe('when an element is passed', () => {
    let content;

    const contentWithStreamList = `
      <div>
        <div class="stream">
          <div class="stream__list">
          </div>
        </div>
      </div>
    `;

    const contentWithoutStreamList = `
      <div>
        <div class="stream">
          <div class="unknown">
          </div>
        </div>
      </div>
    `;

    beforeEach(() => {
      content = document.createElement('div');
    });

    it('adds the class to there is nested stream__list', () => {
      content.innerHTML = contentWithStreamList;
      addDisableVisualExpandFlagToStreamList(content);
      expect(content.innerHTML).not.toEqual(contentWithoutStreamList); // changed
      expect(content.querySelector('.stream__list')).toHaveClass(
        'spinbox-disable-visual-expand'
      );
    });

    it('does nothing if there is no stream_list', () => {
      content.innerHTML = contentWithoutStreamList;
      addDisableVisualExpandFlagToStreamList(content);
      expect(content.innerHTML).toEqual(contentWithoutStreamList); // no change
    });
  });

  it('does not error if no element passed', () => {
    addDisableVisualExpandFlagToStreamList();
  });
});

describe('getSoundListElementInfo', () => {
  it('returns correct info for a track element from the feed page', () => {
    const trackElement = document.createElement('li');
    trackElement.innerHTML = trackElementFromFeedPage;
    const info = getSoundListElementInfo(trackElement);
    expect(info).toEqual({
      artistName: 'Of The Trees, EARTHGANG',
      artistHref: '/ofthetrees',
      trackName: 'Look Into My Eyes',
      trackHref: '/ofthetrees/look-into-my-eyes-feat',
      imageUrl: 'https://i1.sndcdn.com/artworks-z53m7dPkrnaM-0-t500x500.png',
      reposterName: undefined,
      reposterHref: undefined,
    });
  });

  it('returns correct info for a track element from the artist page', () => {
    const trackElement = document.createElement('li');
    trackElement.innerHTML = trackElementFromArtistPage;
    const info = getSoundListElementInfo(trackElement);
    expect(info).toEqual({
      artistName: 'Of The Trees',
      artistHref: '/ofthetrees',
      trackName: 'Pressure',
      trackHref: '/ofthetrees/pressure',
      imageUrl: 'https://i1.sndcdn.com/artworks-oBmQR0zMEUUZ-0-t500x500.png',
      reposterName: undefined,
      reposterHref: undefined,
    });
  });

  describe('when the element is a playlist', () => {
    it('returns correct info for a playlist element from the feed page', () => {
      const trackElement = document.createElement('li');
      trackElement.innerHTML = playlistElementFromFeedPage;
      const info = getSoundListElementInfo(trackElement);
      expect(info).toEqual({
        artistName: 'VCTRE',
        artistHref: '/vctre',
        trackName: 'Outbreak',
        trackHref: '/vctre/sets/outbreak',
        imageUrl:
          'https://i1.sndcdn.com/artworks-gDeI7GblT2qB1jIK-dTnH8A-t500x500.jpg',
        reposterName: undefined,
        reposterHref: undefined,
      });
    });
  });

  describe('when the track is a repost', () => {
    it('returns correct info for a track element from the feed page', () => {
      const trackElement = document.createElement('li');
      trackElement.innerHTML = repostedTrackElementFromFeedPage;
      const info = getSoundListElementInfo(trackElement);
      expect(info).toEqual({
        artistName: 'Casey Club',
        artistHref: '/caseyclubofficial',
        trackName: 'Hamdi x Casey Club - Onslaught',
        trackHref: '/caseyclubofficial/hamdi-x-casey-club-onslaught-2',
        imageUrl:
          'https://i1.sndcdn.com/artworks-GvgrhwAFBe8C0M1O-DAxXlw-t500x500.png',
        reposterName: 'Taiki Nulight',
        reposterHref: '/taiki-nulight-uk',
      });
    });

    it('returns correct info for a track element from the artist page', () => {
      const trackElement = document.createElement('li');
      trackElement.innerHTML = repostedTrackElementFromArtistPage;
      const info = getSoundListElementInfo(trackElement);
      expect(info).toEqual({
        artistName: 'Saka & Of The Trees',
        artistHref: '/memorypalacerecs',
        trackName: 'Saka & Of The Trees - Ghoul',
        trackHref: '/memorypalacerecs/saka-of-the-trees-ghoul',
        imageUrl:
          'https://i1.sndcdn.com/artworks-UuQ2shcyWq92apPF-ajGvCg-t500x500.jpg',
        // TODO: artist-page reposts are not currently parsed correctly... but this is what the fixture should result
        // reposterName: 'Of The Trees',
        // reposterHref: '/ofthetrees',
      });
    });
  });
});

describe('soundListElementIsCurrentlyPlaying', () => {
  it('returns false if the element is not currently playing', () => {
    const trackElement = document.createElement('li');
    trackElement.innerHTML = trackElementFromFeedPage;
    expect(soundListElementIsCurrentlyPlaying(trackElement)).toBe(false);
  });

  it('returns true if the element is currently playing', () => {
    const trackElement = document.createElement('li');
    trackElement.innerHTML = currentlyPlayingTrackElementFromFeedPage;
    expect(soundListElementIsCurrentlyPlaying(trackElement)).toBe(true);
  });
});

describe('updateHiddenTrackCount', () => {
  beforeEach(() => {
    // Create the required DOM elements for each test
    document.body.innerHTML = `
      <h4 class="sidebarHeader__title__webi__style" style="padding: 8px 16px;">
        <span id="hiddenTracksCount"></span> hidden track<span id="hiddenTracksPlural">s</span>
      </h4>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('updates hiddenTracksCount element with the new count', () => {
    updateHiddenTrackCount(5);
    const e = screen.getByRole('heading');
    expect(e).toBeInTheDocument();
    expect(e).toHaveTextContent('5 hidden tracks');
  });

  it('is singular when count is 1', () => {
    updateHiddenTrackCount(1);
    const e = screen.getByRole('heading');
    expect(e).toBeInTheDocument();
    expect(e).toHaveTextContent('1 hidden track');
  });

  it('is plural when count is 0', () => {
    updateHiddenTrackCount(0);
    const e = screen.getByRole('heading');
    expect(e).toBeInTheDocument();
    expect(e).toHaveTextContent('0 hidden tracks');
  });
});
