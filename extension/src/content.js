/**
 * Healthy Instagram — content script
 * Hides distracting Instagram UI elements (Reels icon, Notifications).
 */
(function () {
  "use strict";

  const HIDDEN_CLASS = "healthy-instagram-hidden";
  const HIDDEN_ATTR = "data-healthy-instagram-hidden";

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

  const NAV_SCAN_ROOTS = ["nav", "footer", '[role="navigation"]'];
  const NOTIFICATIONS_PAGE_PATTERN = /^\/accounts\/activity\/?$/;

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

  function hideReelsIcons() {
    for (const selector of REELS_ICON_SELECTORS) {
      for (const element of document.querySelectorAll(selector)) {
        if (element instanceof HTMLAnchorElement && isInstagramReelsLink(element)) {
          hideNavItem(element, "reels-icon");
        } else if (
          element instanceof HTMLElement &&
          !element.querySelector("a[href*='/reels']")
        ) {
          hideElement(element, "reels-icon");
        }
      }
    }

    for (const rootSelector of NAV_SCAN_ROOTS) {
      for (const root of document.querySelectorAll(rootSelector)) {
        for (const link of root.querySelectorAll("a[href]")) {
          if (isInstagramReelsLink(link)) {
            hideNavItem(link, "reels-icon");
          }
        }
      }
    }
  }

  function hideNotificationsIcons() {
    for (const selector of NOTIFICATIONS_ICON_SELECTORS) {
      for (const element of document.querySelectorAll(selector)) {
        if (element instanceof SVGElement) {
          const parentLink = element.closest('a[role="link"], a[href]');
          if (parentLink instanceof HTMLAnchorElement && isInstagramNotificationsLink(parentLink)) {
            hideNavItem(parentLink, "notifications-icon");
          }
          continue;
        }

        if (
          element instanceof HTMLAnchorElement &&
          isInstagramNotificationsLink(element)
        ) {
          hideNavItem(element, "notifications-icon");
        } else if (
          element instanceof HTMLElement &&
          !element.querySelector("a[href*='/accounts/activity']") &&
          !element.querySelector('svg[aria-label="Notifications"]')
        ) {
          hideElement(element, "notifications-icon");
        }
      }
    }

    for (const rootSelector of NAV_SCAN_ROOTS) {
      for (const root of document.querySelectorAll(rootSelector)) {
        for (const link of root.querySelectorAll('a[href], a[role="link"]')) {
          if (link instanceof HTMLAnchorElement && isInstagramNotificationsLink(link)) {
            hideNavItem(link, "notifications-icon");
          }
        }
      }
    }
  }

  function blockNotificationsPage() {
    if (!NOTIFICATIONS_PAGE_PATTERN.test(window.location.pathname)) {
      return;
    }

    window.location.replace("/");
  }

  function installRouteWatcher() {
    const checkRoute = () => {
      blockNotificationsPage();
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
    blockNotificationsPage();
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
      attributeFilter: ["href", "aria-label"],
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
