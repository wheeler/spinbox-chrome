export const bodyAtContentObserverSetup = `
<div id="app">
  <header role="banner" class="header sc-selection-disabled fixed g-z-index-header sc-text-h4"></header>
  <div class="announcements g-z-index-fixed-top g-z-index-header"></div>
  <div class="l-container l-content">
    <div class="l-product-banners l-inner-fullwidth">
      <div class="l-container"><div></div></div>
    </div>
    <div id="content" role="main"></div>
  </div>
  <div class="playControls g-z-index-control-bar">
    <section role="contentinfo" aria-label="miniplayer" class="playControls__inner"></section>
  </div>
</div>
`;

export const initialContentUpdate = `
<div class="l-fluid-fixed">
  <div class="sc-border-light-right l-main">
    <div class="l-heading"></div>
    <div class="l-tabs"></div>
    <div class="l-content">
      <div class="stream">
        <div class="featureHeader"></div>
        <div class="stream__header">
          <h1 class="stream__title">
            Hear the latest posts from the people you’re following:
          </h1>
          <div class="stream__filter"></div>
        </div>
        <div class="stream__list">
          <div class="lazyLoadingList"></div>
        </div>
      </div>
    </div>
  </div>
  <div class="l-sidebar-right">
    <div class="streamSidebar">
      <div></div>
      <div>
        <div class="sidebarModule">Stats loading...</div>
      </div>
      <article class="sidebarModule empty"></article>
      <article
        class="sidebarModule artistShortcutsModule"
        style="display: block"
      >
        <div class="sidebarHeader">
          <h4 class="sidebarHeader__title">New tracks</h4>
        </div>
        <div class="sidebarContent">Loading...</div>
      </article>
      <article class="sidebarModule whoToFollowModule" style="display: block">
        Artists you should follow
      </article>
      <article class="sidebarModule">Likes</article>
      <article class="sidebarModule historyModule" style="display: block">
        <a class="sidebarHeader">Listening history</a>
        <div class="sidebarContent">
          <div class="historicalPlays lazyLoadingList"></div>
        </div>
      </article>
      <article class="sidebarModule mobileApps">Mobile Apps</article>
      <div class="l-footer">Legal etc.</div>
    </div>
  </div>
</div>
`;
