import urllib.request
import re
from bs4 import BeautifulSoup

def test():
    mirror = "https://z-library.se"
    url = f"{mirror}/s/python%20coding"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            print(f"Initial Status: {response.status}")
            print(f"Initial URL: {response.url}")
            
            # Search for redirect link pattern
            # var redirect_link = '...';
            match = re.search(r"var redirect_link\s*=\s*'([^']+)';", html)
            if match:
                redirect_url = match.group(1) + "fp=-3"
                print(f"Found redirect URL: {redirect_url}")
                
                # Fetch redirect URL
                req2 = urllib.request.Request(redirect_url, headers=headers)
                with urllib.request.urlopen(req2) as resp2:
                    html2 = resp2.read().decode('utf-8')
                    print(f"Redirect Status: {resp2.status}")
                    print(f"Redirect URL: {resp2.url}")
                    
                    soup2 = BeautifulSoup(html2, "html.parser")
                    print("Page Title:", soup2.title.string.strip() if soup2.title else "No Title")
                    box = soup2.find("div", {"id": "searchResultBox"})
                    print(f"Found searchResultBox: {box is not None}")
                    if box is None:
                        print("First 500 chars of body:")
                        print(html2[:500])
                    else:
                        print("Successfully found searchResultBox!")
            else:
                print("No redirect link found in HTML.")
    except Exception as e:
        print(f"Error: {e}")

test()
