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
  spinboxTitle.className = 'sidebarHeader sidebarHeader__title__webi__style';
  spinboxTitle.style.display = 'flex';
  const spinboxIcon = document.createElement('img');
  spinboxIcon.src = chrome.runtime.getURL('images/icon-16.png');
  spinboxIcon.style.height = '16px';
  spinboxIcon.style.width = '16px';
  spinboxIcon.style.display = 'inline-block';
  spinboxIcon.style.marginRight = '6px';
  spinboxIcon.style.verticalAlign = 'bottom';
  const globalToggle = createGlobalToggle();
  globalToggle.style.display = 'inline-block';
  globalToggle.style.verticalAlign = 'bottom';
  globalToggle.style.marginLeft = 'auto';
  globalToggle.onclick = (event) => {
    const toggle = event.target.closest('.spinbox-global-toggle');
    const toggleText = toggle.querySelector('.spinbox-global-toggle-text');
    if (toggle.classList.contains('spinbox-global-toggle-active')) {
      toggle.classList.remove('spinbox-global-toggle-active');
      toggle.classList.add('spinbox-global-toggle-disabled');
      toggleText.textContent = 'Disabled';
      document
        .querySelector('.stream__list')
        ?.classList.add('spinbox-override-hidden');
    } else {
      toggle.classList.remove('spinbox-global-toggle-disabled');
      toggle.classList.add('spinbox-global-toggle-active');
      toggleText.textContent = 'Active';
      document
        .querySelector('.stream__list')
        ?.classList.remove('spinbox-override-hidden');
    }
  };
  spinboxTitle.append(spinboxIcon, 'Spinbox', globalToggle);

  const content = document.createElement('div');
  content.className = 'sidebarContent';

  const errorMessage = document.createElement('div');
  errorMessage.id = 'spinboxSidebarErrorMessage';
  errorMessage.className = 'sc-text-error sc-py-1x sc-px-2x';

  const recentlyHiddenContainer = document.createElement('div');
  recentlyHiddenContainer.id = 'recentlyHiddenTracksContainer';
  recentlyHiddenContainer.className = 'sc-py-1x sc-px-2x';

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
  content.append(errorMessage, recentlyHiddenContainer);
  spinboxSidebar.append(spinboxTitle, content);
  return spinboxSidebar;
}

/**
 * Create a pull track button
 * @param onClick
 * @returns {HTMLButtonElement}
 */
export function createPullTrackButton(onClick) {
  const button = document.createElement('button');
  button.className =
    'spinbox-pull sc-button sc-button-medium sc-button-secondary';
  button.style.marginLeft = '4px';
  button.innerText = 'Pull';
  button.onclick = onClick;
  button.ariaLabel = 'Pull Track';
  button.title = 'Pull Track';
  return button;
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

const repostSVG = `<svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.08034 5.71966L4.05001 2.68933L1.01968 5.71966L2.08034 6.78032L3.30002 5.56065V9.75C3.30002 11.2688 4.53124 12.5 6.05002 12.5H8.05002V11H6.05002C5.35966 11 4.80002 10.4404 4.80002 9.75V5.56066L6.01968 6.78032L7.08034 5.71966Z"></path><path d="M11.95 13.3107L8.91969 10.2803L9.98035 9.21968L11.2 10.4393L11.2 5.75C11.2 5.05964 10.6404 4.5 9.95001 4.5L7.95001 4.5L7.95001 3L9.95001 3C11.4688 3 12.7 4.23122 12.7 5.75L12.7 10.4394L13.9197 9.21968L14.9803 10.2803L11.95 13.3107Z"></path></svg>`;
const visibilityEye = `<svg viewBox="0 0 24 24" fill="currentColor" class="spinbox-eye-icon" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
// const visibilityEye = `<svg xmlns="http://w3.org" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q74-133 194-214.5T480-796q146 0 266 81.5T920-500q-74 133-194 214.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-724q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>`;
const visibilityEyeSlash = `<svg fill="currentColor" class="spinbox-slash-eye-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;
// const visibilityEyeSlash = `<svg xmlns="http://w3.org" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 37-12t42-4q75 0 127.5 52.5T660-500q0 22-4 42t-12 37ZM480-200q-146 0-266-81.5T40-500q54-96 135.5-161T356-749l54 54q-54 13-102 41t-88 68q50 101 144.5 160.5T480-266q51 0 99-11t94-33l56 56q-58 31-120.5 47.5T480-200Zm314-72L662-398q37-23 68.5-55t51.5-73q-50-101-144.5-160.5T480-746q-34 0-66.5 5t-63.5 15l-52-52q41-15 86-22.5t92-7.5q146 0 266 81.5T920-500q-26 47-62 89.5T794-272ZM452-612Zm-2 372Zm-80-80L236-456q-10 10-15 22t-5 24q0 30 21 51t51 21q12 0 24-5t22-15Z"/></svg>`;
function createSvgElement(svgString) {
  const template = document.createElement('template');
  template.innerHTML = svgString;
  return template.content.firstElementChild;
}
function createRepostSvg() {
  return createSvgElement(repostSVG);
}

function createGlobalToggle() {
  const svg = createSvgElement(visibilityEye);
  svg.style.height = '16px';
  svg.style.width = '16px';
  svg.style.verticalAlign = 'bottom';
  const svg2 = createSvgElement(visibilityEyeSlash);
  svg2.style.height = '16px';
  svg2.style.width = '16px';
  svg2.style.verticalAlign = 'bottom';
  const globalToggleText = document.createElement('span');
  globalToggleText.className = 'spinbox-global-toggle-text';
  globalToggleText.textContent = 'active';
  // TODO: fix semantics by changing to `button` - requires styling corrections though
  const globalToggle = document.createElement('div');
  globalToggle.className = 'spinbox-global-toggle spinbox-global-toggle-active';
  globalToggle.append(globalToggleText, svg, svg2);
  return globalToggle;
}

export function createCouldNotFindPlaylistMessage(playlistName) {
  const message = document.createElement('div');
  message.className = 'sc-text-special sc-m-2x';
  message.textContent = `Spinbox: Could not find playlist ${playlistName}`;
  return message;
}
