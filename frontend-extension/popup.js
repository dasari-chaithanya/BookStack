// popup.js

let extractedMetadata = {};

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth
  const { bookstack_token } = await chrome.storage.local.get('bookstack_token');
  
  if (!bookstack_token) {
    document.getElementById('main-view').classList.add('hidden');
    document.getElementById('unauth-view').classList.remove('hidden');
    document.getElementById('login-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:5173/login' });
    });
    return;
  }

  // Inject content script to extract metadata instantly
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
    showStatus('Cannot bookmark browser pages.', 'error');
    document.getElementById('save-btn').disabled = true;
    return;
  }

  // Fetch folders
  try {
    const res = await fetch('http://localhost:5000/api/folders', {
      headers: { 'Authorization': `Bearer ${bookstack_token}` }
    });
    if (res.ok) {
      const payload = await res.json();
      const folders = payload.data || [];
      const select = document.getElementById('folder');
      select.innerHTML = '<option value="">Inbox (Default)</option>';
      folders.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = `${f.icon || '📁'} ${f.name}`;
        select.appendChild(opt);
      });
      select.disabled = false;
    }
  } catch (err) {
    console.warn("Could not fetch folders", err);
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content/metadata-extractor.js']
  }, (results) => {
    if (results && results[0] && results[0].result) {
      extractedMetadata = results[0].result;
      
      document.getElementById('url').value = extractedMetadata.url;
      document.getElementById('title').value = extractedMetadata.title;
      document.getElementById('description').value = extractedMetadata.description;
      
      // Update Favicon Preview
      if (extractedMetadata.favicon_url) {
        const logoEl = document.querySelector('.logo');
        logoEl.innerHTML = `<img src="${extractedMetadata.favicon_url}" style="width:16px;height:16px;border-radius:4px;">`;
        logoEl.style.background = 'transparent';
        logoEl.style.border = '1px solid #e5e7eb';
      }
    }
  });

  document.getElementById('dashboard-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/dashboard' });
  });

  // Keyboard shortcut: Enter to save
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('save-btn').click();
    }
  });

  // Handle Save
  document.getElementById('save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    // Update metadata from inputs in case user edited them
    extractedMetadata.title = document.getElementById('title').value;
    extractedMetadata.description = document.getElementById('description').value;
    
    // Parse tags and folder
    const tagsInput = document.getElementById('tags').value;
    extractedMetadata.tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    
    const folderId = document.getElementById('folder').value;
    if (folderId) extractedMetadata.folder_id = parseInt(folderId, 10);

    chrome.runtime.sendMessage({ type: 'SAVE_BOOKMARK', metadata: extractedMetadata }, (response) => {
      if (chrome.runtime.lastError || !response) {
        showStatus('Error communicating with background script', 'error');
        btn.disabled = false;
        btn.textContent = 'Save Bookmark';
        return;
      }

      if (response.error) {
        showStatus(response.error, 'error');
        btn.disabled = false;
        btn.textContent = 'Save Bookmark';
        
        if (response.error.includes('Session expired')) {
          setTimeout(() => {
            document.getElementById('main-view').classList.add('hidden');
            document.getElementById('unauth-view').classList.remove('hidden');
          }, 1500);
        }
      } else {
        showStatus('Saved successfully!', 'success');
        btn.textContent = 'Saved';
        setTimeout(() => window.close(), 1000);
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
