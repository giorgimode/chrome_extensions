const DEFAULT_PATTERNS = [
  {
    id: 1,
    name: "Nebius login success",
    urlPattern: "*/web/msg/info/login_success",
    contentMatch: "Login Successful",
    enabled: true
  },
  {
    id: 2,
    name: "Local OAuth callback",
    urlPattern: "127.0.0.1:*/?code=*",
    contentMatch: "Login is successful",
    enabled: true
  }
];

async function getPatterns() {
  const result = await chrome.storage.sync.get("patterns");
  if (!result.patterns) {
    await chrome.storage.sync.set({ patterns: DEFAULT_PATTERNS });
    return DEFAULT_PATTERNS;
  }
  return result.patterns;
}

function urlMatchesPattern(url, pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regexStr = escaped.replace(/\*/g, ".*");
  const regex = new RegExp(regexStr);
  return regex.test(url);
}

async function checkAndCloseTab(tabId, url) {
  const patterns = await getPatterns();

  for (const pattern of patterns) {
    if (!pattern.enabled) continue;
    if (!pattern.urlPattern.trim()) continue;
    if (!urlMatchesPattern(url, pattern.urlPattern)) continue;

    if (!pattern.contentMatch.trim()) {
      chrome.tabs.remove(tabId);
      return;
    }

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: (searchText) => document.body?.innerText?.includes(searchText),
        args: [pattern.contentMatch]
      });

      if (results?.[0]?.result === true) {
        chrome.tabs.remove(tabId);
        return;
      }
    } catch {
      // Tab may not be scriptable (e.g. chrome:// pages)
    }
  }
}

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0) return;
  checkAndCloseTab(details.tabId, details.url);
});
