// metadata-extractor.js
// Scrapes the current page for title, description, and favicon.

function getMetadata() {
  const title = document.title || '';
  
  let description = '';
  const metaDesc = document.querySelector('meta[name="description"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (metaDesc) description = metaDesc.content;
  else if (ogDesc) description = ogDesc.content;

  let favicon_url = '';
  const iconLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  if (iconLink && iconLink.href) {
    favicon_url = iconLink.href;
  } else {
    favicon_url = new URL('/favicon.ico', window.location.origin).href;
  }

  let image_url = '';
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content) {
    image_url = new URL(ogImage.content, window.location.origin).href;
  }

  return {
    url: window.location.href,
    title,
    description,
    favicon_url,
    image_url
  };
}

getMetadata();
