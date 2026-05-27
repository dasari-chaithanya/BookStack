// Configuration
const API_URL = 'https://bookstack-api-0ir4.onrender.com/api'; // Change to production URL on deployment
const APP_URL = 'https://bookstack-web.onrender.com'; // Change to production URL on deployment

// Listen for token updates from auth-sync.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate sender
  if (!sender.url || (!sender.url.startsWith('http://localhost:5173') && !sender.url.startsWith('http://localhost:5174') && !sender.url.startsWith('https://app.bookstack.com') && !sender.url.startsWith(chrome.runtime.getURL('')))) {
    console.warn('[BookStack Security] Rejected message from untrusted sender:', sender);
    return false;
  }

  if (message.type === 'SAVE_TOKEN') {
    chrome.storage.local.set({ bookstack_token: message.token }, () => {
      console.log('Token saved to chrome.storage');
      sendResponse({ success: true });
    });
    return true; // async
  }
  if (message.type === 'CLEAR_TOKEN') {
    chrome.storage.local.remove('bookstack_token', () => {
      console.log('Token removed from chrome.storage');
      sendResponse({ success: true });
    });
    return true;
  }
  if (message.type === 'SAVE_BOOKMARK') {
    saveBookmark(message.metadata).then(sendResponse);
    return true; // indicates async response
  }
});

// Create Context Menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-bookstack',
    title: 'Save to BookStack',
    contexts: ['page', 'link']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-bookstack') {
    const targetUrl = info.linkUrl || info.pageUrl;
    
    // Fallback minimal metadata if we can't extract properly via context menu
    const metadata = {
      url: targetUrl,
      title: tab.title || targetUrl,
      description: '',
      favicon_url: tab.favIconUrl || '',
      image_url: ''
    };
    
    await saveBookmark(metadata);
  }
});

// Listen for commands (Keyboard shortcut)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === '_execute_action') {
    // The action handles opening the popup, but if we wanted to bypass popup:
    // We could do silent save here instead. The manifest sets it to open popup by default.
  }
});

let isSaving = false;

// Central API call function for the extension
async function saveBookmark(metadata) {
  if (isSaving) return { error: 'Save in progress' };
  isSaving = true;

  try {
    const { bookstack_token } = await chrome.storage.local.get('bookstack_token');
    
    if (!bookstack_token) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
      return { error: 'Not authenticated. Please log into BookStack.' };
    }

    const response = await fetch(`${API_URL}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bookstack_token}`
      },
      body: JSON.stringify({
        url: metadata.url,
        title: metadata.title,
        notes: metadata.description,
        favicon_url: metadata.favicon_url,
        image_url: metadata.image_url,
        tags: metadata.tags || [],
        folder_id: metadata.folder_id || null
      })
    });

    if (response.status === 401) {
      await chrome.storage.local.remove('bookstack_token');
      return { error: 'Session expired. Please log in again.' };
    }

    if (response.status === 409) {
      return { error: 'Already bookmarked' };
    }

    if (!response.ok) {
      const data = await response.json();
      return { error: data.error || 'Failed to save' };
    }

    const result = await response.json();
    
    // Show success badge
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
    
    return { success: true, bookmark: result.data ? result.data.bookmark : result.bookmark };

  } catch (error) {
    return { error: 'Network error. Backend might be offline.' };
  } finally {
    isSaving = false;
  }
}

