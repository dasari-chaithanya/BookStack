let extractedMetadata = {};

document.addEventListener('DOMContentLoaded', async () => {
  // Theme Initialization
  const syncStorage = await chrome.storage.sync.get(['themePreference']);
  const currentTheme = syncStorage.themePreference || 'calm';
  document.documentElement.setAttribute('data-theme', currentTheme);

  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    const isFocus = document.documentElement.getAttribute('data-theme') === 'focus';
    const newTheme = isFocus ? 'calm' : 'focus';
    document.documentElement.setAttribute('data-theme', newTheme);
    chrome.storage.sync.set({ themePreference: newTheme });
  });

  // Onboarding & Auth Check
  const { bookstack_token, has_onboarded, last_folder_id } = await chrome.storage.local.get(['bookstack_token', 'has_onboarded', 'last_folder_id']);
  
  if (!bookstack_token) {
    document.getElementById('main-view').classList.add('hidden');
    document.getElementById('unauth-view').classList.remove('hidden');
    document.getElementById('login-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:5173/login' });
    });
    return;
  }

  if (!has_onboarded) {
    document.getElementById('main-view').classList.add('hidden');
    document.getElementById('onboarding-view').classList.remove('hidden');
    document.getElementById('start-btn').addEventListener('click', () => {
      chrome.storage.local.set({ has_onboarded: true });
      document.getElementById('onboarding-view').classList.add('hidden');
      document.getElementById('main-view').classList.remove('hidden');
      document.getElementById('tags').focus();
    });
    return;
  }

  // Inject content script to extract metadata
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!navigator.onLine) {
    showStatus('You are offline. Please check your connection.', 'error');
  }

  if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
    showStatus('Cannot bookmark browser system pages.', 'error');
    document.getElementById('save-btn').disabled = true;
    return;
  }

  // Fetch folders and apply Smart Memory
  try {
    const res = await fetch('http://localhost:5000/api/folders', {
      headers: { 'Authorization': `Bearer ${bookstack_token}` }
    });
    if (res.ok) {
      const payload = await res.json();
      const folders = payload.data || [];
      const select = document.getElementById('folder');
      select.innerHTML = '<option value="">Inbox</option>';
      folders.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = `${f.icon || '📁'} ${f.name}`;
        select.appendChild(opt);
      });
      select.disabled = false;
      
      if (last_folder_id) {
        select.value = last_folder_id;
      }
    } else if (res.status === 401) {
      throw new Error('Session expired');
    }
  } catch (err) {
    if (err.message === 'Session expired') {
      showStatus('Session expired. Please log in again.', 'error');
      setTimeout(() => chrome.tabs.create({ url: 'http://localhost:5173/login' }), 1500);
    }
  }

  // Extract Metadata
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content/metadata-extractor.js']
  }, (results) => {
    if (results && results[0] && results[0].result) {
      extractedMetadata = results[0].result;
      
      document.getElementById('title').value = extractedMetadata.title;
      document.getElementById('description').value = extractedMetadata.description;
      
      try {
        const domain = new URL(extractedMetadata.url).hostname.replace('www.', '');
        document.getElementById('domain-text').textContent = domain;
      } catch(e) {}
      
      if (extractedMetadata.favicon_url) {
        document.getElementById('favicon-container').innerHTML = `<img src="${extractedMetadata.favicon_url}" alt="favicon">`;
      }

      // Auto-focus tags input for quick keyboard-first saving
      setTimeout(() => document.getElementById('tags').focus(), 50);
    }
  });

  // Notes Collapsible Toggle
  const toggleNotes = document.getElementById('toggle-notes');
  const notesWrapper = document.getElementById('notes-wrapper');
  toggleNotes.addEventListener('click', () => {
    notesWrapper.classList.toggle('hidden');
    if (!notesWrapper.classList.contains('hidden')) {
      document.getElementById('description').focus();
      toggleNotes.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg> Hide Note`;
    } else {
      toggleNotes.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Note`;
    }
  });

  // Keyboard Navigation & Shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('save-btn').click();
    }
    if (e.key === 'Escape') {
      window.close();
    }
  });

  // Optimistic Save
  document.getElementById('save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-btn');
    if (btn.disabled) return;
    
    // 1. Prepare Data
    extractedMetadata.title = document.getElementById('title').value;
    extractedMetadata.description = document.getElementById('description').value;
    
    const tagsInput = document.getElementById('tags').value;
    extractedMetadata.tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    
    const folderId = document.getElementById('folder').value;
    if (folderId) extractedMetadata.folder_id = parseInt(folderId, 10);

    // Save Smart Memory
    chrome.storage.local.set({ last_folder_id: folderId });

    // 2. Optimistic UI Update
    btn.disabled = true;
    const originalBtnContent = btn.innerHTML;
    btn.innerHTML = `
      <span style="display:flex;align-items:center;gap:6px;justify-content:center;width:100%;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Saved
      </span>
    `;
    btn.style.backgroundColor = '#10b981'; // Emerald success
    btn.style.boxShadow = 'none';

    // 3. Background Sync
    chrome.runtime.sendMessage({ type: 'SAVE_BOOKMARK', metadata: extractedMetadata }, (response) => {
      if (chrome.runtime.lastError || !response || response.error) {
        // Revert Optimistic UI on failure
        btn.disabled = false;
        btn.innerHTML = originalBtnContent;
        btn.style.backgroundColor = ''; 
        
        const errMsg = response?.error || 'Failed to connect to BookStack. Are you offline?';
        showStatus(errMsg, 'error');
      } else {
        // Success - close popup quickly
        setTimeout(() => window.close(), 400);
      }
    });
  });
});

function showStatus(msg, type) {
  const statusEl = document.getElementById('status-banner');
  statusEl.textContent = msg;
  statusEl.className = `status-banner ${type}`;
  statusEl.classList.remove('hidden');
}
