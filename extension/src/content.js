/**
 * Healthy Instagram — content script
 * Hides distracting Instagram UI elements (Reels, Notifications, Search, Create, Feed).
 */
(function () {
  "use strict";

  const HIDDEN_CLASS = "healthy-instagram-hidden";
  const HIDDEN_ATTR = "data-healthy-instagram-hidden";
  const HOME_CLASS = "healthy-instagram-home";

  const REELS_ICON_SELECTORS = [
    'a[href="/reels/"]',
    'a[href="/reels"]',
    'a[href*="/reels/"]',
    'a[aria-label="Reels"]',
    'a[aria-label="Reel"]',
    'span[aria-label="Reels"]',
    'div[role="menuitem"] a[href*="/reels"]',
  ];

  const NOTIFICATIONS_ICON_SELECTORS = [
    'a[href="/accounts/activity/"]',
    'a[href="/accounts/activity"]',
    'a[href*="/accounts/activity"]',
    'a[aria-label="Notifications"]',
    'a[role="link"][aria-label="Notifications"]',
    'a[role="link"]:has(svg[aria-label="Notifications"])',
    'svg[aria-label="Notifications"]',
    'span[aria-label="Notifications"]',
  ];

  const SEARCH_ICON_SELECTORS = [
    'a[href="/explore/"]',
    'a[href="/explore"]',
    'a[href*="/explore/"]',
    'a[aria-label="Search"]',
    'a[aria-label="Explore"]',
    'span[aria-label="Search"]',
    'span[aria-label="Explore"]',
    'svg[aria-label="Search"]',
    'svg[aria-label="Explore"]',
    'input[placeholder="Search"]',
  ];

  const CREATE_ICON_SELECTORS = [
    'a[href="/create/"]',
    'a[href="/create"]',
    'a[href*="/create/"]',
    'a[aria-label="New post"]',
    'a[aria-label="New Post"]',
    'a[aria-label="Create"]',
    'svg[aria-label="New post"]',
    'svg[aria-label="New Post"]',
    'svg[aria-label="Create"]',
    'span[aria-label="New post"]',
    'span[aria-label="New Post"]',
    'span[aria-label="Create"]',
    'div[role="menuitem"] a[href*="/create"]',
  ];

  const NAV_SCAN_ROOTS = ["nav", "footer", '[role="navigation"]'];
  const HOME_PAGE_PATTERN = /^\/$/;
  const NOTIFICATIONS_PAGE_PATTERN = /^\/accounts\/activity\/?$/;
  const EXPLORE_PAGE_PATTERN = /^\/explore/;
  const CREATE_PAGE_PATTERN = /^\/create/;

  function getAccessibleLabel(element) {
    const direct = element.getAttribute("aria-label");
    if (direct) {
      return direct;
    }

    const nested = element.querySelector("svg[aria-label], [aria-label]");
    return nested?.getAttribute("aria-label") || "";
  }

  function isInstagramReelsLink(element) {
    if (!(element instanceof HTMLAnchorElement)) {
      return false;
    }

    const href = element.getAttribute("href") || "";
    const label = getAccessibleLabel(element).toLowerCase();

    if (href === "/reels/" || href === "/reels") {
      return true;
    }

    if (/^\/reels\/?(\?|$)/.test(href)) {
      return true;
    }

    if (label === "reels" || label === "reel") {
      return true;
    }

    return false;
  }

  function isInstagramNotificationsLink(element) {
    if (!(element instanceof HTMLAnchorElement)) {
      return false;
    }

    const href = element.getAttribute("href") || "";
    const label = getAccessibleLabel(element).toLowerCase();

    if (label.includes("direct")) {
      return false;
    }

    if (label.includes("messages")) {
      return false;
    }

    if (href === "/accounts/activity/" || href === "/accounts/activity") {
      return true;
    }

    if (/^\/accounts\/activity\/?(\?|$)/.test(href)) {
      return true;
    }

    if (label === "notifications" || label.startsWith("notification")) {
      return href === "#" || href === "" || /^\/accounts\/activity/.test(href);
    }

    return false;
  }

  function isInstagramSearchLink(element) {
    if (!(element instanceof HTMLAnchorElement)) {
      return false;
    }

    const href = element.getAttribute("href") || "";
    const label = getAccessibleLabel(element).toLowerCase();

    if (href === "/explore/" || href === "/explore") {
      return true;
    }

    if (/^\/explore\/?(\?|$)/.test(href)) {
      return true;
    }

    if (label === "search" || label === "explore") {
      return true;
    }

    return false;
  }

  function isInstagramCreateControl(element) {
    if (element instanceof HTMLInputElement) {
      return false;
    }

    const href =
      element instanceof HTMLAnchorElement ? element.getAttribute("href") || "" : "";
    const label = getAccessibleLabel(element).toLowerCase();

    if (href === "/create/" || href === "/create") {
      return true;
    }

    if (/^\/create\/?(\?|$)/.test(href)) {
      return true;
    }

    if (
      label === "new post" ||
      label === "create" ||
      label.startsWith("new post")
    ) {
      return true;
    }

    return false;
  }

  function hideElement(element, id) {
    if (!element || element.getAttribute(HIDDEN_ATTR) === id) {
      return;
    }

    element.classList.add(HIDDEN_CLASS);
    element.setAttribute(HIDDEN_ATTR, id);
    element.setAttribute("aria-hidden", "true");
    element.setAttribute("tabindex", "-1");
  }

  function hideNavItem(link, id) {
    hideElement(link, id);

    const navRow =
      link.closest('div[role="menuitem"]') ||
      link.closest("li") ||
      link.closest('span[class*="html-span"]') ||
      link.closest("span")?.parentElement;

    if (navRow && navRow !== document.body) {
      hideElement(navRow, id);
    }
  }

  function hideIconBySelectors(selectors, id, matcher) {
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (element instanceof HTMLAnchorElement && matcher(element)) {
          hideNavItem(element, id);
          continue;
        }

        if (element instanceof HTMLInputElement && selector.includes("placeholder")) {
          const searchRow =
            element.closest('div[role="button"]') ||
            element.closest('div[role="menuitem"]') ||
            element.closest("li") ||
            element.parentElement?.parentElement;

          hideElement(element, id);
          if (searchRow && searchRow !== document.body) {
            hideElement(searchRow, id);
          }
          continue;
        }

        if (element instanceof SVGElement || element instanceof HTMLSpanElement) {
          const parentControl = element.closest(
            'a[role="link"], a[href], div[role="button"], div[role="menuitem"]'
          );
          if (parentControl instanceof HTMLElement && matcher(parentControl)) {
            hideNavItem(parentControl, id);
          }
          continue;
        }

        if (element instanceof HTMLElement && matcher(element)) {
          hideNavItem(element, id);
        }
      }
    }
  }

  function hideIconsInNavRoots(matcher, id) {
    for (const rootSelector of NAV_SCAN_ROOTS) {
      for (const root of document.querySelectorAll(rootSelector)) {
        for (const link of root.querySelectorAll('a[href], a[role="link"]')) {
          if (link instanceof HTMLAnchorElement && matcher(link)) {
            hideNavItem(link, id);
          }
        }
      }
    }
  }

  function hideReelsIcons() {
    hideIconBySelectors(REELS_ICON_SELECTORS, "reels-icon", isInstagramReelsLink);
    hideIconsInNavRoots(isInstagramReelsLink, "reels-icon");
  }

  function hideNotificationsIcons() {
    hideIconBySelectors(
      NOTIFICATIONS_ICON_SELECTORS,
      "notifications-icon",
      isInstagramNotificationsLink
    );
    hideIconsInNavRoots(isInstagramNotificationsLink, "notifications-icon");
  }

  function hideSearchIcons() {
    hideIconBySelectors(SEARCH_ICON_SELECTORS, "search-icon", isInstagramSearchLink);
    hideIconsInNavRoots(isInstagramSearchLink, "search-icon");
  }

  function hideCreateIcons() {
    hideIconBySelectors(
      CREATE_ICON_SELECTORS,
      "create-icon",
      isInstagramCreateControl
    );

    for (const rootSelector of NAV_SCAN_ROOTS) {
      for (const root of document.querySelectorAll(rootSelector)) {
        for (const control of root.querySelectorAll(
          'a[href], a[role="link"], div[role="button"]'
        )) {
          if (
            control instanceof HTMLElement &&
            isInstagramCreateControl(control)
          ) {
            hideNavItem(control, "create-icon");
          }
        }
      }
    }

    for (const control of document.querySelectorAll(
      'a[href*="/create"], svg[aria-label="New post"], svg[aria-label="New Post"], svg[aria-label="Create"]'
    )) {
      const parentControl = control.closest(
        'a[role="link"], a[href], div[role="button"], div[role="menuitem"]'
      );
      if (
        parentControl instanceof HTMLElement &&
        isInstagramCreateControl(parentControl)
      ) {
        hideNavItem(parentControl, "create-icon");
      }
    }
  }

  function updateHomeMode() {
    const root = document.documentElement;
    if (!root) {
      return;
    }

    if (HOME_PAGE_PATTERN.test(window.location.pathname)) {
      root.classList.add(HOME_CLASS);
    } else {
      root.classList.remove(HOME_CLASS);
    }
  }

  function hideFeedPosts() {
    if (!HOME_PAGE_PATTERN.test(window.location.pathname)) {
      return;
    }

    for (const article of document.querySelectorAll("main article")) {
      hideElement(article, "feed-post");
    }

    for (const loader of document.querySelectorAll(
      'main div[data-visualcompletion="loading-state"][role="progressbar"]'
    )) {
      hideElement(loader, "feed-loader");
    }
  }

  function blockDistractingPages() {
    const path = window.location.pathname;

    if (
      NOTIFICATIONS_PAGE_PATTERN.test(path) ||
      EXPLORE_PAGE_PATTERN.test(path) ||
      CREATE_PAGE_PATTERN.test(path)
    ) {
      window.location.replace("/");
    }
  }

  function installRouteWatcher() {
    const checkRoute = () => {
      updateHomeMode();
      blockDistractingPages();
      hideFeedPosts();
    };

    window.addEventListener("popstate", checkRoute);

    const { pushState, replaceState } = history;
    history.pushState = function (...args) {
      pushState.apply(this, args);
      checkRoute();
    };
    history.replaceState = function (...args) {
      replaceState.apply(this, args);
      checkRoute();
    };
  }

  function hideDistractions() {
    hideReelsIcons();
    hideNotificationsIcons();
    hideSearchIcons();
    hideCreateIcons();
    updateHomeMode();
    hideFeedPosts();
    blockDistractingPages();
  }

  let hideScheduled = false;

  function scheduleHideDistractions() {
    if (hideScheduled) {
      return;
    }
    hideScheduled = true;
    requestAnimationFrame(() => {
      hideScheduled = false;
      hideDistractions();
    });
  }

  function startObserver() {
    const root = document.documentElement || document.body;
    if (!root) {
      return;
    }

    const observer = new MutationObserver(() => {
      scheduleHideDistractions();
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "aria-label", "placeholder"],
    });
  }

  function init() {
    installRouteWatcher();
    hideDistractions();
    startObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
