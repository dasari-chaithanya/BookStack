import re
from bs4 import BeautifulSoup
from app.extensions import db
from app.models import Bookmark


def normalize_url(url):
    """
    Strips tracking parameters and normalizes URLs.
    """
    from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
    try:
        parsed = urlparse(url)
        # Remove common tracking params
        qs = parse_qs(parsed.query)
        tracking_params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']
        for param in tracking_params:
            qs.pop(param, None)
        
        new_query = urlencode(qs, doseq=True)
        # Standardize protocol and lowercase netloc
        scheme = parsed.scheme.lower() if parsed.scheme else 'https'
        netloc = parsed.netloc.lower()
        if netloc.startswith('www.'):
            netloc = netloc[4:]
            
        normalized = urlunparse((scheme, netloc, parsed.path, parsed.params, new_query, parsed.fragment))
        # Remove trailing slash for consistency
        if normalized.endswith('/'):
            normalized = normalized[:-1]
        return normalized
    except:
        return url

class ImportService:
    @staticmethod
    def import_html(user_id, file_content):
        soup = BeautifulSoup(file_content, 'html.parser')
        links = soup.find_all('a')
        
        imported_count = 0
        skipped_count = 0
        
        # Pre-fetch user's existing URLs to memory to prevent N+1 queries during duplicate check
        existing_urls = {b.url for b in Bookmark.query.filter_by(user_id=user_id).all()}
        
        for link in links:
            url = link.get('href')
            if not url or not re.match(r'^https?:\/\/', url):
                continue
                
            normalized_url = normalize_url(url)
            title = link.text.strip() or 'Imported Bookmark'
            
            # Duplicate check using O(1) set lookup
            if normalized_url in existing_urls:
                skipped_count += 1
                continue
                
            bookmark = Bookmark(
                user_id=user_id,
                title=title,
                url=normalized_url,
                source='import'
            )
            db.session.add(bookmark)
            existing_urls.add(normalized_url)
            imported_count += 1
            
            # Commit in chunks to avoid memory lockups for massive imports
            if imported_count % 100 == 0:
                db.session.commit()
                
        db.session.commit()
        return {
            'imported': imported_count,
            'skipped_duplicates': skipped_count
        }
