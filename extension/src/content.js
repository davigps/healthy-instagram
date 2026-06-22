/**
 * Healthy Instagram — content script
 * Hides distracting Instagram UI elements. First target: the Reels icon.
 */
(function () {
  "use strict";

  const HIDDEN_CLASS = "healthy-instagram-hidden";
  const HIDDEN_ATTR = "data-healthy-instagram-hidden";

  /**
   * Selectors for the Reels navigation icon/link.
   * Instagram is a SPA and re-renders nav on route changes, so we use
   * attribute-based selectors instead of generated class names.
   */
  const REELS_ICON_SELECTORS = [
    'a[href="/reels/"]',
    'a[href="/reels"]',
    'a[href*="/reels/"]',
    'a[aria-label="Reels"]',
    'a[aria-label="Reel"]',
    'span[aria-label="Reels"]',
    'div[role="menuitem"] a[href*="/reels"]',
  ];

  function isInstagramReelsLink(element) {
    if (!(element instanceof HTMLAnchorElement)) {
      return false;
    }

    const href = element.getAttribute("href") || "";
    const label = (element.getAttribute("aria-label") || "").toLowerCase();

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

  function hideElement(element) {
    if (!element || element.getAttribute(HIDDEN_ATTR) === "reels-icon") {
      return;
    }

    element.classList.add(HIDDEN_CLASS);
    element.setAttribute(HIDDEN_ATTR, "reels-icon");
    element.setAttribute("aria-hidden", "true");
    element.setAttribute("tabindex", "-1");
  }

  function hideReelsIconNavItem(link) {
    hideElement(link);

    // Hide the surrounding nav row/tab when Instagram wraps the link in a container.
    const navRow =
      link.closest('div[role="menuitem"]') ||
      link.closest("li") ||
      link.closest("span")?.parentElement;

    if (navRow && navRow !== document.body) {
      hideElement(navRow);
    }
  }

  function hideReelsIcons() {
    for (const selector of REELS_ICON_SELECTORS) {
      for (const element of document.querySelectorAll(selector)) {
        if (element instanceof HTMLAnchorElement && isInstagramReelsLink(element)) {
          hideReelsIconNavItem(element);
        } else if (
          element instanceof HTMLElement &&
          !element.querySelector("a[href*='/reels']")
        ) {
          hideElement(element);
        }
      }
    }

    // Fallback: scan anchor tags only when selectors miss due to DOM changes.
    for (const link of document.querySelectorAll("a[href]")) {
      if (isInstagramReelsLink(link)) {
        hideReelsIconNavItem(link);
      }
    }
  }

  function startObserver() {
    const root = document.documentElement || document.body;
    if (!root) {
      return;
    }

    const observer = new MutationObserver(() => {
      hideReelsIcons();
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "aria-label", "class"],
    });
  }

  function init() {
    hideReelsIcons();
    startObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
