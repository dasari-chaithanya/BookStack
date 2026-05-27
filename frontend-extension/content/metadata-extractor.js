// metadata-extractor.js
// Scrapes the current page for title, description, and favicon.

(() => {
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
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');

  if (ogImage && ogImage.content) {
    image_url = new URL(ogImage.content, window.location.origin).href;
  } else if (twitterImage && twitterImage.content) {
    image_url = new URL(twitterImage.content, window.location.origin).href;
  } else if (appleIcon && appleIcon.href) {
    // Some sites use their apple touch icon as a good fallback preview
    image_url = appleIcon.href;
  } else {
    // As a last resort, try to find the largest image on the page
    const images = Array.from(document.querySelectorAll('img'))
      .filter(img => img.width > 200 && img.height > 200 && img.src);
    if (images.length > 0) {
      image_url = images[0].src;
    }
  }

  return {
    url: window.location.href,
    title,
    description,
    favicon_url,
    image_url
  };
})();
