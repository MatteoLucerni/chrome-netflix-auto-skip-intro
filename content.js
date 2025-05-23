const prefs = {
  skipIntroDelay: 1,
  skipEnabled: true,
  hideThreshold: 70,
  hideHomeEnabled: true,
  hideSearchEnabled: true,
};

(function initPrefs() {
  try {
    chrome.storage.sync.get(Object.keys(prefs), result => {
      Object.assign(prefs, result);
      console.log('Prefs loaded', prefs);
    });
  } catch (e) {
    console.warn('Could not load prefs (context invalidated?)', e);
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      for (let key in changes) {
        if (prefs.hasOwnProperty(key)) {
          prefs[key] = changes[key].newValue;
          console.log(`Pref ${key} changed to`, changes[key].newValue);
        }
      }
    });
  } catch (e) {
    console.warn('Could not bind onChanged (context invalidated?)', e);
  }
})();

function skipIntro() {
  if (!prefs.skipEnabled) return;

  const netflixBtn = document.querySelector(
    "button[data-uia='player-skip-intro']"
  );
  const primeBtn = document.querySelector('[class*="skipelement-button"]');
  const recapBtn =
    document.querySelector(
      "button[data-uia='viewer-skip-recap'], button[data-uia='player-skip-recap']"
    ) || document.querySelector('[class*="skip-recap"], [class*="SkipRecap"]');

  const btn = netflixBtn || primeBtn || recapBtn;
  if (!btn) return;

  setTimeout(() => {
    btn.click();
    console.log('Skipped intro/recap');
  }, prefs.skipIntroDelay * 1000);
}

function hideWatched() {
  const { hideThreshold, hideHomeEnabled, hideSearchEnabled } = prefs;

  document
    .querySelectorAll(
      'ytd-thumbnail-overlay-resume-playback-renderer #progress'
    )
    .forEach(bar => {
      const pct = parseFloat(bar.style.width) || 0;
      if (pct <= hideThreshold) return;

      let item = bar;
      while (
        item &&
        !item.matches('ytd-rich-item-renderer, ytd-video-renderer')
      ) {
        item = item.parentElement;
      }
      if (!item) return;

      if (item.matches('ytd-rich-item-renderer') && hideHomeEnabled) {
        item.style.display = 'none';
      }
      if (item.matches('ytd-video-renderer') && hideSearchEnabled) {
        item.style.display = 'none';
      }
    });
}

function onMutations() {
  skipIntro();
  hideWatched();
}

skipIntro();
hideWatched();

const observer = new MutationObserver(onMutations);
observer.observe(document.body, { childList: true, subtree: true });
