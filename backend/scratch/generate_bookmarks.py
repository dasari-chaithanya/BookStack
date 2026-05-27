import random
import time

def generate_html_bookmarks(count, filename):
    print(f"Generating {count} bookmarks...")
    start = time.time()
    
    html = [
        '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
        '<!-- This is an automatically generated file. -->',
        '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
        '<TITLE>Bookmarks</TITLE>',
        '<H1>Bookmarks</H1>',
        '<DL><p>'
    ]
    
    for i in range(count):
        # Generate some malformed URLs randomly
        if random.random() < 0.05:
            url = f"not-a-valid-url-{i}"
        else:
            url = f"https://example.com/page-{i}-{random.randint(1000, 9999)}"
            
        title = f"Stress Test Bookmark {i} 🚀"
        ts = int(time.time()) - random.randint(0, 10000000)
        
        # Add random tags
        tags = []
        if random.random() < 0.3:
            tags.append("test")
        if random.random() < 0.2:
            tags.append("stress")
        tags_str = ",".join(tags)
        
        tag_attr = f' TAGS="{tags_str}"' if tags else ''
        html.append(f'    <DT><A HREF="{url}" ADD_DATE="{ts}"{tag_attr}>{title}</A>')
        
    html.append('</DL><p>')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write('\n'.join(html))
        
    duration = time.time() - start
    print(f"Generated {filename} in {duration:.2f} seconds.")

if __name__ == "__main__":
    generate_html_bookmarks(10000, "stress_test_10k.html")
