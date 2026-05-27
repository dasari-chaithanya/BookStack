import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from .import_service import normalize_url

def fetch_metadata(url):
    normalized_url = normalize_url(url)
        
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(normalized_url, headers=headers, timeout=5)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 1. Title
        title_tag = soup.find('title')
        title = title_tag.string.strip() if title_tag and title_tag.string else ''
        if not title:
            og_title = soup.find('meta', property='og:title')
            if og_title and og_title.get('content'):
                title = og_title['content'].strip()
                
        # 2. Description
        description = ''
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            description = meta_desc['content'].strip()
        else:
            og_desc = soup.find('meta', property='og:description')
            if og_desc and og_desc.get('content'):
                description = og_desc['content'].strip()
                
        # 3. Open Graph Image
        image_url = ''
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            image_url = og_image['content'].strip()
            
        # 4. Favicon
        favicon_url = ''
        icon_link = soup.find('link', rel=lambda r: r and any('icon' in val.lower() for val in r))
        if icon_link and icon_link.get('href'):
            favicon_url = icon_link['href']
        else:
            favicon_url = '/favicon.ico'
            
        # Make favicon/image URLs absolute if they are relative
        if image_url:
            image_url = urljoin(normalized_url, image_url)
        if favicon_url:
            favicon_url = urljoin(normalized_url, favicon_url)

        return {
            'title': title,
            'description': description,
            'favicon_url': favicon_url,
            'image_url': image_url,
            'normalized_url': normalized_url
        }
    except Exception as e:
        raise Exception(f"Failed to fetch metadata: {str(e)}")
