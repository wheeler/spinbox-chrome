/**
 * Elements created by Spinbox that are added to the feed page
 */

/**
 * Create Sidebar
 * @returns {HTMLElement}
 */
export function createSidebarElement() {
  const spinboxSidebar = document.createElement('article');
  spinboxSidebar.className = 'sidebarModule spinbox-sidebar';

  const title = document.createElement('h4');
  title.className = 'sidebarHeader__title__webi__style';
  title.style.padding = '8px 16px';
  const hiddenTrackCount = document.createElement('span');
  hiddenTrackCount.id = 'hiddenTracksCount';
  title.appendChild(hiddenTrackCount);
  title.append(' hidden track');
  const hiddenTracksPlural = document.createElement('span');
  hiddenTracksPlural.id = 'hiddenTracksPlural';
  hiddenTracksPlural.textContent = 's';
  title.appendChild(hiddenTracksPlural);
  spinboxSidebar.appendChild(title);

  const content = document.createElement('div');
  content.className = 'sidebarContent';

  const contentDescription = document.createElement('div');
  contentDescription.style.padding = '8px 16px';
  contentDescription.textContent = 'spinbox is active.';

  const recentlyHidden = document.createElement('div');
  recentlyHidden.id = 'recentlyHiddenTracksContainer';
  recentlyHidden.style.padding = '8px 16px';
  const recentlyHiddenTitle = document.createElement('div');
  recentlyHiddenTitle.innerText = 'Recently hidden';
  recentlyHiddenTitle.className =
    'sc-text-secondary sidebarHeader__title__webi__style sc-mb-1x';
  recentlyHidden.appendChild(recentlyHiddenTitle);
  content.appendChild(recentlyHidden);
  const recentlyHiddenList = document.createElement('div');
  recentlyHiddenList.id = 'recentlyHiddenTrackList';
  recentlyHidden.appendChild(recentlyHiddenList);

  spinboxSidebar.appendChild(content);
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

const repostSVG = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.08034 5.71966L4.05001 2.68933L1.01968 5.71966L2.08034 6.78032L3.30002 5.56065V9.75C3.30002 11.2688 4.53124 12.5 6.05002 12.5H8.05002V11H6.05002C5.35966 11 4.80002 10.4404 4.80002 9.75V5.56066L6.01968 6.78032L7.08034 5.71966Z" fill="currentColor"></path><path d="M11.95 13.3107L8.91969 10.2803L9.98035 9.21968L11.2 10.4393L11.2 5.75C11.2 5.05964 10.6404 4.5 9.95001 4.5L7.95001 4.5L7.95001 3L9.95001 3C11.4688 3 12.7 4.23122 12.7 5.75L12.7 10.4394L13.9197 9.21968L14.9803 10.2803L11.95 13.3107Z" fill="currentColor"></path></svg>`;
export function createRepostSvg() {
  const template = document.createElement('template');
  template.innerHTML = repostSVG;
  return template.content.firstElementChild;
}
