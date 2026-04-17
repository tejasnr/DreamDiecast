#!/usr/bin/env python3
"""
Parse HTML for SEO analysis - extract metadata, schema, headings, etc.
"""
import sys
import json
import re
from html.parser import HTMLParser
from typing import List, Dict, Any, Optional

class SEOHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = None
        self.meta_tags = []
        self.headings = []
        self.links = []
        self.images = []
        self.scripts = []
        self.current_heading = None
        self.in_script = False
        self.script_content = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == 'title':
            self.current_heading = 'title'
        elif tag == 'meta':
            self.meta_tags.append(attrs_dict)
        elif tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            self.current_heading = tag
        elif tag == 'a':
            href = attrs_dict.get('href', '')
            self.links.append({
                'href': href,
                'text': '',
                'rel': attrs_dict.get('rel', ''),
                'title': attrs_dict.get('title', '')
            })
        elif tag == 'img':
            self.images.append({
                'src': attrs_dict.get('src', ''),
                'alt': attrs_dict.get('alt', ''),
                'width': attrs_dict.get('width', ''),
                'height': attrs_dict.get('height', '')
            })
        elif tag == 'script' and attrs_dict.get('type') == 'application/ld+json':
            self.in_script = True
            self.script_content = ""

    def handle_endtag(self, tag):
        if tag == 'script' and self.in_script:
            self.in_script = False
            try:
                schema = json.loads(self.script_content)
                self.scripts.append(schema)
            except json.JSONDecodeError:
                pass
        self.current_heading = None

    def handle_data(self, data):
        data = data.strip()
        if not data:
            return

        if self.in_script:
            self.script_content += data
        elif self.current_heading == 'title':
            self.title = data
        elif self.current_heading in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            self.headings.append({
                'level': self.current_heading,
                'text': data
            })
        elif self.links and not self.links[-1]['text']:
            self.links[-1]['text'] = data

def extract_seo_data(html: str) -> Dict[str, Any]:
    """Extract SEO-relevant data from HTML."""
    parser = SEOHTMLParser()
    parser.feed(html)

    # Extract specific meta tags
    meta_map = {}
    og_tags = {}
    twitter_tags = {}

    for meta in parser.meta_tags:
        if 'name' in meta:
            meta_map[meta['name']] = meta.get('content', '')
        elif 'property' in meta:
            prop = meta['property']
            if prop.startswith('og:'):
                og_tags[prop[3:]] = meta.get('content', '')
            meta_map[prop] = meta.get('content', '')
        elif 'name' in str(meta) or 'property' in str(meta):
            # Twitter tags
            if meta.get('name', '').startswith('twitter:'):
                twitter_tags[meta['name'][8:]] = meta.get('content', '')

    # Count headings by level
    heading_counts = {'h1': 0, 'h2': 0, 'h3': 0, 'h4': 0, 'h5': 0, 'h6': 0}
    for h in parser.headings:
        heading_counts[h['level']] += 1

    # Detect e-commerce signals
    html_lower = html.lower()
    ecommerce_signals = {
        'has_cart': 'cart' in html_lower or 'add to cart' in html_lower,
        'has_price': bool(re.search(r'₹|rs\.?\s*\d+|inr', html_lower)),
        'has_product_schema': any(s.get('@type') == 'Product' for s in parser.scripts),
        'has_organization_schema': any(s.get('@type') == 'Organization' for s in parser.scripts),
        'has_breadcrumb_schema': any(s.get('@type') == 'BreadcrumbList' for s in parser.scripts),
        'platform_signals': {
            'shopify': 'shopify' in html_lower,
            'woocommerce': 'woocommerce' in html_lower,
            'magento': 'magento' in html_lower,
            'nextjs': 'next.js' in html_lower or '_next' in html_lower,
        }
    }

    # Image analysis
    images_without_alt = sum(1 for img in parser.images if not img['alt'])

    return {
        'title': parser.title,
        'meta': meta_map,
        'og_tags': og_tags,
        'twitter_tags': twitter_tags,
        'headings': parser.headings,
        'heading_counts': heading_counts,
        'h1_count': heading_counts['h1'],
        'links': parser.links[:20],  # First 20 links only
        'internal_links': [l for l in parser.links if l['href'].startswith('/')][:10],
        'images': parser.images[:20],  # First 20 images
        'images_total': len(parser.images),
        'images_without_alt': images_without_alt,
        'structured_data': parser.scripts,
        'schema_types': [s.get('@type') for s in parser.scripts if '@type' in s],
        'ecommerce_signals': ecommerce_signals,
        'word_count': len(html.split()),
        'has_robots_meta': 'robots' in meta_map,
        'robots_content': meta_map.get('robots', ''),
        'canonical_url': meta_map.get('canonical', ''),
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        html = sys.stdin.read()
    else:
        with open(sys.argv[1], 'r') as f:
            html = f.read()

    data = extract_seo_data(html)
    print(json.dumps(data, indent=2, ensure_ascii=False))
