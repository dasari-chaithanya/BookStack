// auth-sync.js
// Runs on the BookStack web app domain to capture auth tokens and forward them to the extension.

console.log("[BookStack Extension] Auth sync script loaded.");

window.addEventListener('message', (event) => {
  // Only accept messages from the same frame
  if (event.source !== window) return;
  
  // Whitelist origins for security
  const validOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://app.bookstack.com'];
  if (!validOrigins.includes(event.origin)) return;

  if (event.data && event.data.type === 'BOOKSTACK_AUTH_TOKEN') {
    const token = event.data.token;
    if (token) {
      chrome.runtime.sendMessage({ type: 'SAVE_TOKEN', token: token }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("[BookStack Extension] Error saving token:", chrome.runtime.lastError);
        } else {
          console.log("[BookStack Extension] Token securely synced to extension.");
        }
      });
    } else {
      // If token is null, user logged out
      chrome.runtime.sendMessage({ type: 'CLEAR_TOKEN' });
    }
  }
});
