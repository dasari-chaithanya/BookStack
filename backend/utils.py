from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

def normalize_url(url):
    """
    Normalizes a URL by standardizing the protocol, lowercasing the hostname,
    removing 'www.', removing trailing slashes, stripping tracking parameters,
    and removing hash fragments.
    """
    try:
        if not url.startswith(('http://', 'https://', 'ftp://')):
            url = 'https://' + url
            
        parsed = urlparse(url)
        
        # Hostname normalization (lowercase and strip www.)
        netloc = parsed.netloc.lower()
        if netloc.startswith('www.'):
            netloc = netloc[4:]
            
        # Path normalization (strip trailing slash)
        path = parsed.path
        if path.endswith('/') and path != '/':
            path = path.rstrip('/')
            
        # Query parameters normalization (strip tracking params)
        query_params = parse_qsl(parsed.query, keep_blank_values=True)
        tracking_prefixes = ('utm_', 'ref', 'fbclid', 'gclid')
        
        filtered_params = []
        for k, v in query_params:
            k_lower = k.lower()
            if not any(k_lower.startswith(prefix) for prefix in tracking_prefixes):
                filtered_params.append((k, v))
                
        query = urlencode(filtered_params)
        
        # Remove fragment
        fragment = ''
        
        normalized = urlunparse((parsed.scheme, netloc, path, parsed.params, query, fragment))
        return normalized
    except Exception:
        return url
