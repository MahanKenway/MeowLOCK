import urllib.request
import json
import tarfile
import io

url = "https://pypi.org/pypi/zlibrary/json"
try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
    
    urls = data['urls']
    source_url = None
    for u in urls:
        if u['packagetype'] == 'sdist':
            source_url = u['url']
            break
            
    if not source_url:
        print("Sdist not found, trying any url")
        source_url = urls[0]['url']
        
    print(f"Downloading from {source_url}...")
    with urllib.request.urlopen(source_url) as response:
        file_bytes = response.read()
        
    if source_url.endswith('.tar.gz'):
        with tarfile.open(fileobj=io.BytesIO(file_bytes), mode="r:gz") as tar:
            tar.extractall(path="./zlib_temp")
            print("Extracted source distribution to ./zlib_temp!")
    else:
        import zipfile
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as zip_ref:
            zip_ref.extractall("./zlib_temp")
            print("Extracted wheel to ./zlib_temp!")
            
except Exception as e:
    print("Error:", e)
