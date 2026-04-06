/**
 * Elements created by Spinbox that are added to the feed page
 */

/**
 * Create Spinbox Sidebar Element
 * @returns {HTMLElement}
 */
export function createSidebarElement() {
  const spinboxSidebar = document.createElement('article');
  spinboxSidebar.className = 'sidebarModule spinbox-sidebar';

  const spinboxTitle = document.createElement('h4');
  spinboxTitle.className = 'sidebarHeader__title__webi__style';
  spinboxTitle.style.padding = '8px 16px';
  const spinboxIcon = document.createElement('img');
  spinboxIcon.src = chrome.runtime.getURL('images/icon-16.png');
  spinboxIcon.style.display = 'inline-block';
  spinboxIcon.style.marginRight = '6px';
  spinboxIcon.style.verticalAlign = 'bottom';
  spinboxTitle.append(spinboxIcon, 'Spinbox');

  const content = document.createElement('div');
  content.className = 'sidebarContent';

  const recentlyHiddenContainer = document.createElement('div');
  recentlyHiddenContainer.id = 'recentlyHiddenTracksContainer';
  recentlyHiddenContainer.style.padding = '8px 16px';

  const recentlyHiddenHeading = document.createElement('div');
  recentlyHiddenHeading.className = 'sc-text-secondary sc-mb-0.5x';
  recentlyHiddenHeading.style.display = 'flex';

  const recentlyHiddenTitleText = document.createElement('span');
  recentlyHiddenTitleText.innerText = 'Recently hidden';
  recentlyHiddenTitleText.className = 'sidebarHeader__title__webi__style ';
  recentlyHiddenTitleText.style.flexGrow = '1';

  const recentlyHiddenCountSection = document.createElement('span');
  recentlyHiddenCountSection.className = 'spinbox-text-dim';
  recentlyHiddenCountSection.style.fontSize = '12px';

  const hiddenTrackCount = document.createElement('span');
  hiddenTrackCount.id = 'hiddenTracksCount';

  recentlyHiddenCountSection.append(hiddenTrackCount, ' total');
  recentlyHiddenHeading.append(
    recentlyHiddenTitleText,
    recentlyHiddenCountSection
  );

  const recentlyHiddenList = document.createElement('div');
  recentlyHiddenList.id = 'recentlyHiddenTrackList';

  recentlyHiddenContainer.append(recentlyHiddenHeading, recentlyHiddenList);
  content.append(recentlyHiddenContainer);
  spinboxSidebar.append(spinboxTitle, content);
  return spinboxSidebar;
}

/**
 * Create a hide track button
 * @param onClick
 * @returns {HTMLButtonElement}
 */
export function createHideTrackButton(onClick) {
  const hideButton = document.createElement('button');
  hideButton.className =
    'spinbox-hide sc-button sc-button-medium sc-button-secondary';
  hideButton.style.marginLeft = '4px';
  hideButton.innerText = '✕';
  hideButton.onclick = onClick;

  hideButton.ariaLabel = 'Hide Track';
  hideButton.title = 'Hide Track';
  return hideButton;
}

/**
 * Create a no hidden tracks message
 * @returns {HTMLLIElement}
 */
export function createNoHiddenTracksMessage() {
  const noHiddenTracks = document.createElement('li');
  noHiddenTracks.id = 'noHiddenTracks';
  noHiddenTracks.className = 'spinbox-recently-hidden-track sc-mb-0.5x';
  noHiddenTracks.textContent = 'No hidden tracks yet';
  return noHiddenTracks;
}

/**
 * Create an undo hide track row element
 * @param track
 * @param undoHideTrackFn
 * @returns {HTMLLIElement}
 */
export function createRecentlyHiddenTrackElement(track, undoHideTrackFn) {
  const trackElement = document.createElement('li');
  trackElement.className = 'spinbox-recently-hidden-track sc-mb-0.5x';

  const imageContainer = document.createElement('span');
  imageContainer.className = 'spinbox-track-image';
  if (track.imageUrl) {
    imageContainer.style.backgroundImage = `url('${track.imageUrl}')`;
  }
  trackElement.append(imageContainer);

  const undoHideButton = document.createElement('button');
  undoHideButton.className =
    'spinbox-undo-hide-button sc-button sc-button-secondary';
  undoHideButton.innerText = '⟲';
  undoHideButton.ariaLabel = 'Un-Hide Track';
  undoHideButton.title = 'Un-Hide Track';
  undoHideButton.onclick = () => undoHideTrackFn(track.trackHref);

  const hiddenTrackDescription = document.createElement('div');
  hiddenTrackDescription.className = 'spinbox-hidden-track-description';

  const hiddenTrackDescriptionArtist = document.createElement('div');
  hiddenTrackDescriptionArtist.className =
    'spinbox-hidden-track-description-artist spinbox-text-dim';

  if (track.reposterName) {
    hiddenTrackDescriptionArtist.append(track.reposterName);
    hiddenTrackDescriptionArtist.append(createRepostSvg());
  }
  hiddenTrackDescriptionArtist.append(track.artistName);

  const hiddenTrackDescriptionTrack = document.createElement('div');
  hiddenTrackDescriptionTrack.className =
    'spinbox-hidden-track-description-track';
  hiddenTrackDescriptionTrack.append(track.trackName);

  hiddenTrackDescription.append(
    hiddenTrackDescriptionArtist,
    hiddenTrackDescriptionTrack
  );

  trackElement.append(hiddenTrackDescription, undoHideButton);

  return trackElement;
}

const repostSVG = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.08034 5.71966L4.05001 2.68933L1.01968 5.71966L2.08034 6.78032L3.30002 5.56065V9.75C3.30002 11.2688 4.53124 12.5 6.05002 12.5H8.05002V11H6.05002C5.35966 11 4.80002 10.4404 4.80002 9.75V5.56066L6.01968 6.78032L7.08034 5.71966Z" fill="currentColor"></path><path d="M11.95 13.3107L8.91969 10.2803L9.98035 9.21968L11.2 10.4393L11.2 5.75C11.2 5.05964 10.6404 4.5 9.95001 4.5L7.95001 4.5L7.95001 3L9.95001 3C11.4688 3 12.7 4.23122 12.7 5.75L12.7 10.4394L13.9197 9.21968L14.9803 10.2803L11.95 13.3107Z" fill="currentColor"></path></svg>`;
function createRepostSvg() {
  const template = document.createElement('template');
  template.innerHTML = repostSVG;
  return template.content.firstElementChild;
}
