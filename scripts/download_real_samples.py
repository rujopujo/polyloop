"""
Download real-world open-licensed e-waste and polymer images from Wikimedia Commons
into sample_images/ using 800px web thumbnails for speed.
"""
import os

import requests

HEADERS = {'User-Agent': 'PolyLoopBot/1.0 (academic research; info@polyloop.org)'}

SEARCH_TARGETS = [
    {
        "query": "E-waste pile monitors computers",
        "save_name": "real_ewaste_pile.jpg",
        "label": "Real Post-Consumer E-Waste Scrap Pile"
    },
    {
        "query": "CRT television monitor disassembled",
        "save_name": "real_crt_monitor_back.jpg",
        "label": "Real CRT Monitor Housing & Rear Vents"
    },
    {
        "query": "ThinkPad bottom laptop casing",
        "save_name": "real_thinkpad_bottom.jpg",
        "label": "Real Laptop Bottom Chassis"
    },
    {
        "query": "disassembled computer keyboard casing",
        "save_name": "real_keyboard_casing.jpg",
        "label": "Real Mechanical Keyboard Shell"
    },
    {
        "query": "printer disassembled chassis plastic",
        "save_name": "real_printer_panel.jpg",
        "label": "Real Laser Printer Panel"
    },
    {
        "query": "Resin identification code plastic recycling mark",
        "save_name": "real_plastic_resin_stamp.jpg",
        "label": "Real Embossed Resin Identification Stamp"
    },
    {
        "query": "Desktop PC computer chassis bezel",
        "save_name": "real_desktop_pc_chassis.jpg",
        "label": "Real Desktop PC Front Bezel"
    }
]

DEFAULT_OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_images"))

def fetch_real_samples(output_dir=None):
    if output_dir is None:
        output_dir = DEFAULT_OUTPUT_DIR
    os.makedirs(output_dir, exist_ok=True)
    api_url = "https://commons.wikimedia.org/w/api.php"
    downloaded = 0

    for item in SEARCH_TARGETS:
        target_path = os.path.join(output_dir, item["save_name"])
        params = {
            'action': 'query',
            'generator': 'search',
            'gsrsearch': item["query"],
            'gsrlimit': 6,
            'gsrnamespace': 6,
            'prop': 'imageinfo',
            'iiprop': 'url|mime',
            'iiurlwidth': 800,  # Request 800px fast thumbnail
            'format': 'json'
        }

        try:
            r = requests.get(api_url, params=params, headers=HEADERS, timeout=8)
            data = r.json()
            pages = data.get('query', {}).get('pages', {})

            for pdata in pages.values():
                img_info = pdata.get('imageinfo', [{}])[0]
                thumb_url = img_info.get('thumburl') or img_info.get('url', '')

                if thumb_url and not thumb_url.endswith('.svg') and not thumb_url.endswith('.webm'):
                    img_resp = requests.get(thumb_url, headers=HEADERS, timeout=10)
                    if img_resp.status_code == 200 and len(img_resp.content) > 5000:
                        with open(target_path, 'wb') as f:
                            f.write(img_resp.content)
                        print(f"[OK] Downloaded: {item['save_name']} ({len(img_resp.content)} bytes)")
                        downloaded += 1
                        break
        except (OSError, requests.RequestException) as e:
            print(f"[ERR] Failed for {item['query']}: {e}")

    print(f"\nDone! Downloaded {downloaded} real images to {output_dir}/")

if __name__ == "__main__":
    fetch_real_samples()
