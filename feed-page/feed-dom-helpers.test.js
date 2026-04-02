import { getByRole, screen, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import {
  addDisableVisualExpandFlagToStreamList,
  addRecentlyHiddenTrack,
  clickAddToPlaylist,
  getSoundListElementInfo,
  renderRecentlyHiddenTracksList,
  soundListElementIsCurrentlyPlaying,
  unhideTrackElementWithHref,
  updateHiddenTrackCount,
} from './feed-dom-helpers.js';
import {
  alreadyAddedPlaylistItemElement,
  currentlyPlayingTrackElementFromFeedPage,
  playlistElementFromFeedPage,
  playlistItemElement,
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

describe('addRecentlyHiddenTrack', () => {
  const mockUndoHideTrack = jest.fn();
  const newlyHiddenTrack = {
    trackHref: '/artist/track-name',
    artistName: 'The Artist',
    trackName: 'The Track',
  };

  describe('when there is a no hidden tracks message', () => {
    beforeEach(() => {
      document.body.innerHTML = `
      <div>
        <div id="recentlyHiddenTrackList">
          <li id="noHiddenTracks">No hidden tracks</li>
        </div>
      </div>
    `;
    });

    it('replaces the no hidden tracks message with the track', () => {
      let listItem = screen.getByRole('listitem');
      expect(listItem).toHaveTextContent('No hidden tracks');

      addRecentlyHiddenTrack(newlyHiddenTrack, mockUndoHideTrack);

      // note: getByRole implies only one found
      listItem = screen.getByRole('listitem');
      expect(listItem).toHaveTextContent('The Artist');
      expect(listItem).toHaveTextContent('The Track');
      expect(listItem).not.toHaveTextContent('No hidden tracks');
    });

    it('renders an undo button for the hidden track', async () => {
      addRecentlyHiddenTrack(newlyHiddenTrack, mockUndoHideTrack);

      const listItem = screen.getByRole('listitem');
      const undoButton = within(listItem).getByRole('button');
      expect(undoButton).toBeInTheDocument();
      await userEvent.click(undoButton);
      expect(mockUndoHideTrack).toHaveBeenCalledWith('/artist/track-name');
    });
  });

  describe('when there were already hidden tracks', () => {
    beforeEach(() => {
      document.body.innerHTML = `
      <div>
        <div id="recentlyHiddenTrackList">
          <li>Fake Track 1</li>
          <li>Fake Track 2</li>
          <li>Fake Track 3</li>
        </div>
      </div>
    `;
    });

    it('adds the hidden track at the top', () => {
      let listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);

      addRecentlyHiddenTrack(newlyHiddenTrack, mockUndoHideTrack);

      listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(4);
      expect(listItems[0]).toHaveTextContent('The Artist');
      expect(listItems[0]).toHaveTextContent('The Track');
      expect(listItems[1]).toHaveTextContent('Fake Track 1');
      expect(listItems[2]).toHaveTextContent('Fake Track 2');
      expect(listItems[3]).toHaveTextContent('Fake Track 3');
    });
  });

  describe('when there were already five hidden tracks', () => {
    beforeEach(() => {
      document.body.innerHTML = `
      <div>
        <div id="recentlyHiddenTrackList">
          <li>Fake Track 1</li>
          <li>Fake Track 2</li>
          <li>Fake Track 3</li>
          <li>Fake Track 4</li>
          <li>Fake Track 5</li>
        </div>
      </div>
    `;
    });

    it('adds the hidden track at the top and drops the last one', () => {
      let listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(5);

      addRecentlyHiddenTrack(newlyHiddenTrack, mockUndoHideTrack);

      listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(5);
      expect(listItems[0]).toHaveTextContent('The Artist');
      expect(listItems[0]).toHaveTextContent('The Track');
      expect(listItems[1]).toHaveTextContent('Fake Track 1');
      expect(listItems[2]).toHaveTextContent('Fake Track 2');
      expect(listItems[3]).toHaveTextContent('Fake Track 3');
      expect(listItems[4]).toHaveTextContent('Fake Track 4');
    });
  });
});

describe('renderRecentlyHiddenTracksList', () => {
  const mockUndoHideTrack = jest.fn();
  let hiddenTrackList;

  beforeEach(() => {
    hiddenTrackList = [];
    document.body.innerHTML = `
      <div>
        <div id="recentlyHiddenTrackList"></div>
      </div>
    `;
  });

  describe('when there are no hidden tracks', () => {
    it('renders a message when there are no hidden tracks', () => {
      renderRecentlyHiddenTracksList(hiddenTrackList, mockUndoHideTrack);
      expect(screen.getByRole('listitem')).toHaveTextContent(
        'No hidden tracks yet'
      );
    });
  });

  describe('when there are hidden tracks', () => {
    beforeEach(() => {
      hiddenTrackList = [
        {
          trackHref: '/artist/track-name',
          artistName: 'The Artist',
          trackName: 'The Track',
        },
        {
          trackHref: '/another-artist/another-track-name',
          artistName: 'Another Artist',
          trackName: 'Another Track',
        },
      ];
    });

    it('renders the list of recently hidden tracks', () => {
      renderRecentlyHiddenTracksList(hiddenTrackList, mockUndoHideTrack);

      const renderedItems = screen.getAllByRole('listitem');
      expect(renderedItems).toHaveLength(2);
      expect(renderedItems[0]).toHaveTextContent('The Artist');
      expect(renderedItems[0]).toHaveTextContent('The Track');
      expect(renderedItems[1]).toHaveTextContent('Another Artist');
      expect(renderedItems[1]).toHaveTextContent('Another Track');
    });

    it('renders undo buttons for the hidden tracks', async () => {
      renderRecentlyHiddenTracksList(hiddenTrackList, mockUndoHideTrack);

      const renderedItems = screen.getAllByRole('listitem');
      expect(renderedItems).toHaveLength(2);

      const undoButton = within(renderedItems[0]).getByRole('button');
      expect(undoButton).toBeInTheDocument();
      await userEvent.click(undoButton);
      expect(mockUndoHideTrack).toHaveBeenCalledWith('/artist/track-name');

      const undoButton2 = within(renderedItems[1]).getByRole('button');
      expect(undoButton2).toBeInTheDocument();
      await userEvent.click(undoButton2);
      expect(mockUndoHideTrack).toHaveBeenCalledWith(
        '/another-artist/another-track-name'
      );
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

describe('unhideTrackElementWithHref', () => {
  const trackList = `
    <ul class="lazyLoadingList__list">
      <li class="soundList__item spinbox-hidden">
        <a href="/track/is-hidden" class="soundTitle__title">Snoozer</a>
      </li>
      <li class="soundList__item spinbox-hidden">
        <a href="/track/is-also-hidden" class="soundTitle__title">Another Snoozer</a>
      </li>
      <li class="soundList__item">
        <a href="/track/is-visible" class="soundTitle__title">Banger</a>
      </li>
      <li class="soundList__item">
        <a href="/track/is-also-visible" class="soundTitle__title">Another Banger</a>
      </li>
    </ul>
  `;

  beforeEach(() => {
    document.body.innerHTML = trackList;
  });

  it('does nothing to a visible tracks', () => {
    unhideTrackElementWithHref('/track/is-visible');

    // nothing should change
    expect(document.body.innerHTML).toEqual(trackList);

    // baseline test for checking the classes on the list items
    const tracks = screen.getAllByRole('listitem');
    expect(tracks[0]).toHaveClass('spinbox-hidden');
    expect(tracks[1]).toHaveClass('spinbox-hidden');
    expect(tracks[2]).not.toHaveClass('spinbox-hidden');
    expect(tracks[3]).not.toHaveClass('spinbox-hidden');
  });

  it('removes the hidden class from a matching hidden track', () => {
    unhideTrackElementWithHref('/track/is-hidden');

    const tracks = screen.getAllByRole('listitem');
    expect(tracks[0]).not.toHaveClass('spinbox-hidden');
    expect(tracks[1]).toHaveClass('spinbox-hidden');
    expect(tracks[2]).not.toHaveClass('spinbox-hidden');
    expect(tracks[3]).not.toHaveClass('spinbox-hidden');
  });

  it('does nothing to non-matching tracks', () => {
    unhideTrackElementWithHref('/track/not-matching');
    expect(document.body.innerHTML).toEqual(trackList);
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

describe('clickAddToPlaylist', () => {
  let onClick;

  const makeElement = (html) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    wrapper.querySelector('button').onclick = onClick;
    return wrapper.firstElementChild;
  };

  beforeEach(() => {
    onClick = jest.fn();
  });

  it('clicks the submit button within the element', () => {
    const element = makeElement(playlistItemElement);

    clickAddToPlaylist(element);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not click the button if the button is marked as selected', () => {
    const element = makeElement(alreadyAddedPlaylistItemElement);

    clickAddToPlaylist(element);

    expect(onClick).not.toHaveBeenCalled();
  });
});
