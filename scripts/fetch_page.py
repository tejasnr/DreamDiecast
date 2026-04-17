#!/usr/bin/env python3
"""
Fetch HTML content from a URL for SEO analysis.
"""
import sys
import urllib.request
import urllib.error
from urllib.parse import urlparse

def fetch_page(url: str, timeout: int = 15) -> dict:
    """
    Fetch page HTML and metadata.
    Returns dict with status, headers, html, and error if any.
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; ClaudeSEO/1.0; +https://claude.ai)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        }

        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout) as response:
            html = response.read().decode('utf-8', errors='replace')
            return {
                'status': response.status,
                'url': response.url,
                'headers': dict(response.headers),
                'html': html,
                'error': None
            }
    except urllib.error.HTTPError as e:
        return {
            'status': e.code,
            'url': url,
            'headers': dict(e.headers) if e.headers else {},
            'html': '',
            'error': f'HTTP {e.code}: {e.reason}'
        }
    except urllib.error.URLError as e:
        return {
            'status': 0,
            'url': url,
            'headers': {},
            'html': '',
            'error': f'URL Error: {e.reason}'
        }
    except Exception as e:
        return {
            'status': 0,
            'url': url,
            'headers': {},
            'html': '',
            'error': f'Error: {str(e)}'
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python fetch_page.py <url>")
        sys.exit(1)

    url = sys.argv[1]
    result = fetch_page(url)

    if result['error']:
        print(f"Error fetching {url}: {result['error']}", file=sys.stderr)
        sys.exit(1)

    print(result['html'])
