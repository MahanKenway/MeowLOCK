import sys
import os
import json
import asyncio
from urllib.parse import quote

# Add the extracted zlibrary package folder to python path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(script_dir, "zlib_temp", "zlibrary-1.0.2", "src"))

has_zlibrary = True
zlibrary_import_error = None
try:
    import zlibrary
    from zlibrary.libasync import AsyncZlib
    from zlibrary.abs import BookItem
except Exception as e:
    has_zlibrary = False
    zlibrary_import_error = str(e)

async def do_login(email, password, mirror=None):
    if not has_zlibrary:
        return {
            "status": "error",
            "message": f"Z-Library engine is currently disabled/unavailable due to missing dependencies: {zlibrary_import_error}"
        }
    lib = AsyncZlib()
    if mirror:
        lib.login_domain = f"{mirror}/rpc.php"
        lib.domain = mirror
        lib.mirror = mirror
    try:
        profile = await lib.login(email, password)
        return {
            "status": "success",
            "cookies": lib.cookies,
            "mirror": lib.mirror
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

import urllib.request
import urllib.parse

def fetch_gutenberg_search(query, page, limit=10):
    url = f"https://gutendex.com/books/?q={urllib.parse.quote(query)}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"})
        with urllib.request.urlopen(req, timeout=8) as response:
            data = json.loads(response.read().decode('utf-8'))
            results = data.get("results", [])
            
            books = []
            for item in results:
                book_id = item.get("id")
                formats = item.get("formats", {})
                
                html_url = formats.get("text/html") or formats.get("text/html; charset=utf-8")
                epub_url = formats.get("application/epub+zip")
                txt_url = formats.get("text/plain") or formats.get("text/plain; charset=utf-8")
                cover_url = formats.get("image/jpeg") or ""
                
                read_url = html_url or txt_url or epub_url
                down_url = epub_url or html_url or txt_url
                
                authors = [a.get("name", "Unknown Author") for a in item.get("authors", [])]
                if not authors:
                    authors = ["Project Gutenberg Author"]
                
                books.append({
                    "id": f"gut-{book_id}",
                    "name": item.get("title", "Unknown Gutenberg Title"),
                    "isbn": f"GUT-{book_id}",
                    "authors": authors,
                    "cover": cover_url,
                    "publisher": "Project Gutenberg Public Domain",
                    "year": "Public Domain",
                    "language": item.get("languages", ["en"])[0] if item.get("languages") else "en",
                    "extension": "epub" if epub_url else ("html" if html_url else "txt"),
                    "size": "Free",
                    "rating": "4.8",
                    "quality": "Direct Open Access",
                    "url": f"https://www.gutenberg.org/ebooks/{book_id}",
                    "download_url": down_url,
                    "read_url": read_url
                })
            
            total_count = len(books)
            start_idx = (int(page) - 1) * limit
            end_idx = start_idx + limit
            sliced_books = books[start_idx:end_idx]
            
            return {
                "status": "success",
                "books": sliced_books,
                "total_pages": max(1, (total_count + limit - 1) // limit),
                "current_page": int(page)
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Gutenberg Search failed: {str(e)}"
        }

def fetch_gutenberg_book(book_id):
    raw_id = book_id[4:]
    url = f"https://gutendex.com/books/{raw_id}/"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"})
        with urllib.request.urlopen(req, timeout=8) as response:
            item = json.loads(response.read().decode('utf-8'))
            formats = item.get("formats", {})
            html_url = formats.get("text/html") or formats.get("text/html; charset=utf-8")
            epub_url = formats.get("application/epub+zip")
            txt_url = formats.get("text/plain") or formats.get("text/plain; charset=utf-8")
            cover_url = formats.get("image/jpeg") or ""
            
            read_url = html_url or txt_url or epub_url
            down_url = epub_url or html_url or txt_url
            
            authors = [a.get("name", "Unknown Author") for a in item.get("authors", [])]
            if not authors:
                authors = ["Project Gutenberg Author"]
                
            return {
                "status": "success",
                "book": {
                    "id": book_id,
                    "isbn": f"GUT-{raw_id}",
                    "url": f"https://www.gutenberg.org/ebooks/{raw_id}",
                    "cover": cover_url,
                    "name": item.get("title", "Unknown Gutenberg Title"),
                    "publisher": "Project Gutenberg Public Domain",
                    "authors": authors,
                    "year": "Public Domain",
                    "language": item.get("languages", ["en"])[0] if item.get("languages") else "en",
                    "extension": "epub" if epub_url else "html",
                    "size": "Free",
                    "rating": "4.8",
                    "download_url": down_url,
                    "read_url": read_url
                }
            }
    except Exception as e:
        return {
            "status": "success",
            "book": {
                "id": book_id,
                "isbn": f"GUT-{raw_id}",
                "url": f"https://www.gutenberg.org/ebooks/{raw_id}",
                "cover": "",
                "name": "Project Gutenberg Book Details",
                "publisher": "Project Gutenberg",
                "authors": ["Project Gutenberg Author"],
                "year": "Public Domain",
                "language": "en",
                "extension": "epub",
                "size": "Free",
                "rating": "4.8",
                "download_url": f"https://www.gutenberg.org/ebooks/{raw_id}",
                "read_url": f"https://www.gutenberg.org/ebooks/{raw_id}"
            }
        }

def fetch_open_library_search(query, page, limit=10):
    url = f"https://openlibrary.org/search.json?q={urllib.parse.quote(query)}&page={page}&limit={limit}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"})
        with urllib.request.urlopen(req, timeout=8) as response:
            data = json.loads(response.read().decode('utf-8'))
            docs = data.get("docs", [])
            num_found = data.get("numFound", 0)
            total_pages = (num_found + limit - 1) // limit
            
            books = []
            for doc in docs:
                work_id = doc.get('key', '').split('/')[-1]
                cover_id = doc.get('cover_i')
                cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else ""
                
                books.append({
                    "id": f"ol-{work_id}",
                    "name": doc.get("title", "Unknown Title"),
                    "isbn": doc.get("isbn", [""])[0] if doc.get("isbn") else "",
                    "authors": doc.get("author_name", ["Unknown Author"]),
                    "cover": cover_url,
                    "publisher": doc.get("publisher", ["Unknown Publisher"])[0] if doc.get("publisher") else "Unknown Publisher",
                    "year": str(doc.get("first_publish_year", "N/A")),
                    "language": doc.get("language", ["en"])[0] if doc.get("language") else "en",
                    "extension": "epub/pdf",
                    "size": "N/A",
                    "rating": "4.5",
                    "quality": "Open Library Registry",
                    "url": f"https://openlibrary.org{doc.get('key', '')}"
                })
            return {
                "status": "success",
                "books": books,
                "total_pages": total_pages,
                "current_page": int(page)
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Open Library Search failed: {str(e)}"
        }

def fetch_open_library_book(book_id):
    work_id = book_id[3:]  # strip 'ol-'
    url = f"https://openlibrary.org/works/{work_id}.json"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"})
        with urllib.request.urlopen(req, timeout=8) as response:
            data = json.loads(response.read().decode('utf-8'))
            title = data.get("title", "Unknown Title")
            covers = data.get("covers", [])
            cover_url = f"https://covers.openlibrary.org/b/id/{covers[0]}-M.jpg" if covers else ""
            
            return {
                "status": "success",
                "book": {
                    "id": book_id,
                    "isbn": "",
                    "url": f"https://openlibrary.org/works/{work_id}",
                    "cover": cover_url,
                    "name": title,
                    "publisher": "Open Library Registry",
                    "authors": ["Open Library Author"],
                    "year": "N/A",
                    "language": "en",
                    "extension": "epub",
                    "size": "N/A",
                    "rating": "4.5",
                    "download_url": f"https://openlibrary.org/works/{work_id}"
                }
            }
    except Exception as e:
        return {
            "status": "success",
            "book": {
                "id": book_id,
                "isbn": "",
                "url": f"https://openlibrary.org/works/{work_id}",
                "cover": "",
                "name": "Open Library Book Details",
                "publisher": "Open Library",
                "authors": ["Open Library Author"],
                "year": "N/A",
                "language": "en",
                "extension": "epub",
                "size": "N/A",
                "rating": "4.5",
                "download_url": f"https://openlibrary.org/works/{work_id}"
            }
        }

async def do_search(query, cookies, page, limit=10, source="all", mirror=None):
    if source == "gutenberg":
        return fetch_gutenberg_search(query, page, limit)
    elif source == "open_library":
        return fetch_open_library_search(query, page, limit)
    elif source == "z_library":
        if not has_zlibrary:
            return {
                "status": "error",
                "message": f"Z-Library search is currently unavailable (Python dependencies missing: {zlibrary_import_error}). Please try Gutenberg or Open Library."
            }
        # Force Z-Library only
        lib = AsyncZlib()
        lib.cookies = cookies if cookies else {}
        lib.mirror = mirror if mirror else "https://z-library.se"
        from zlibrary.profile import ZlibProfile
        lib.profile = ZlibProfile(lib._r, lib.cookies, lib.mirror, "https://z-library.sk")
        try:
            paginator = await asyncio.wait_for(lib.search(q=query, count=limit), timeout=6.0)
            paginator.page = int(page)
            raw_html = await asyncio.wait_for(paginator.fetch_page(), timeout=6.0)
            paginator.parse_page(raw_html)
            books = []
            page_books = paginator.storage.get(paginator.page, [])
            for b in page_books:
                books.append({
                    "id": b.get("id"),
                    "name": b.get("name"),
                    "isbn": b.get("isbn"),
                    "authors": b.get("authors", []),
                    "cover": b.get("cover"),
                    "publisher": b.get("publisher"),
                    "year": b.get("year"),
                    "language": b.get("language"),
                    "extension": b.get("extension"),
                    "size": b.get("size"),
                    "rating": b.get("rating"),
                    "quality": b.get("quality"),
                    "url": b.get("url")
                })
            return {
                "status": "success",
                "books": books,
                "total_pages": paginator.total,
                "current_page": paginator.page
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Z-Library Search failed: {str(e)}"
            }

    # Default 'all' source: try Z-Library if cookies exist and has_zlibrary is True, otherwise do a beautiful combined search
    has_zlib_login = cookies and len(cookies) > 0 and has_zlibrary
    if has_zlib_login:
        try:
            lib = AsyncZlib()
            lib.cookies = cookies
            lib.mirror = mirror if mirror else "https://z-library.se"
            from zlibrary.profile import ZlibProfile
            lib.profile = ZlibProfile(lib._r, lib.cookies, lib.mirror, "https://z-library.sk")
            
            paginator = await asyncio.wait_for(lib.search(q=query, count=limit), timeout=5.0)
            paginator.page = int(page)
            raw_html = await asyncio.wait_for(paginator.fetch_page(), timeout=5.0)
            paginator.parse_page(raw_html)
            
            books = []
            page_books = paginator.storage.get(paginator.page, [])
            for b in page_books:
                books.append({
                    "id": b.get("id"),
                    "name": b.get("name"),
                    "isbn": b.get("isbn"),
                    "authors": b.get("authors", []),
                    "cover": b.get("cover"),
                    "publisher": b.get("publisher"),
                    "year": b.get("year"),
                    "language": b.get("language"),
                    "extension": b.get("extension"),
                    "size": b.get("size"),
                    "rating": b.get("rating"),
                    "quality": b.get("quality"),
                    "url": b.get("url")
                })
            if len(books) > 0:
                return {
                    "status": "success",
                    "books": books,
                    "total_pages": paginator.total,
                    "current_page": paginator.page
                }
        except Exception:
            pass # fall back to free sources

    # Merged Free Sources: Project Gutenberg + Open Library!
    gut_res = fetch_gutenberg_search(query, page, limit=5)
    ol_res = fetch_open_library_search(query, page, limit=5)
    
    combined_books = []
    gut_books = gut_res.get("books", []) if gut_res.get("status") == "success" else []
    ol_books = ol_res.get("books", []) if ol_res.get("status") == "success" else []
    
    # Interleave results for a rich variety
    max_len = max(len(gut_books), len(ol_books))
    for i in range(max_len):
        if i < len(gut_books):
            combined_books.append(gut_books[i])
        if i < len(ol_books):
            combined_books.append(ol_books[i])
            
    total_p = max(gut_res.get("total_pages", 1), ol_res.get("total_pages", 1))
    
    return {
        "status": "success",
        "books": combined_books,
        "total_pages": total_p,
        "current_page": int(page)
    }

async def do_fetch_book(book_id, cookies, mirror=None):
    if str(book_id).startswith("gut-"):
        return fetch_gutenberg_book(book_id)
    elif str(book_id).startswith("ol-"):
        return fetch_open_library_book(book_id)
        
    if not has_zlibrary:
        return {
            "status": "error",
            "message": f"Z-Library engine is currently disabled/unavailable due to missing dependencies: {zlibrary_import_error}"
        }
    lib = AsyncZlib()
    lib.cookies = cookies if cookies else {}
    lib.mirror = mirror if mirror else "https://z-library.se"
    
    from zlibrary.profile import ZlibProfile
    lib.profile = ZlibProfile(lib._r, lib.cookies, lib.mirror, "https://z-library.sk")
    
    try:
        book = await asyncio.wait_for(lib.get_by_id(book_id), timeout=6.0)
        return {
            "status": "success",
            "book": {
                "id": book.get("id"),
                "isbn": book.get("isbn"),
                "url": book.get("url"),
                "cover": book.get("cover"),
                "name": book.get("name"),
                "publisher": book.get("publisher"),
                "authors": book.get("authors", []),
                "year": book.get("year"),
                "language": book.get("language"),
                "extension": book.get("extension"),
                "size": book.get("size"),
                "rating": book.get("rating"),
                "download_url": book.get("download_url")
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

def search_direct_copies(title, authors=None):
    gut_res = fetch_gutenberg_search(title, 1, limit=5)
    ol_res = fetch_open_library_search(title, 1, limit=5)
    
    links = []
    
    if gut_res.get("status") == "success":
        for book in gut_res.get("books", []):
            if book.get("download_url"):
                links.append({
                    "title": f"Gutenberg: {book['name']}",
                    "url": book["download_url"],
                    "format": book["extension"].upper() if book.get("extension") else "TXT",
                    "source": "Project Gutenberg"
                })
                
    if ol_res.get("status") == "success":
        for book in ol_res.get("books", []):
            if book.get("id"):
                work_id = book["id"].replace("ol-", "")
                links.append({
                    "title": f"Open Library: {book['name']}",
                    "url": f"https://openlibrary.org/works/{work_id}",
                    "format": "READ",
                    "source": "Open Library Catalog"
                })
                
    return {"status": "success", "links": links}

async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "No arguments provided"}))
        return
        
    try:
        args = json.loads(sys.argv[1])
        action = args.get("action")
        mirror = args.get("mirror")
        
        if action == "login":
            res = await do_login(args["email"], args["password"], mirror)
            print(json.dumps(res))
        elif action == "search":
            res = await do_search(
                args["query"], 
                args.get("cookies", {}), 
                args.get("page", 1), 
                limit=10, 
                source=args.get("source", "all"), 
                mirror=mirror
            )
            print(json.dumps(res))
        elif action == "fetch_book":
            res = await do_fetch_book(args["id"], args.get("cookies", {}), mirror)
            print(json.dumps(res))
        elif action == "search_direct_copies":
            res = search_direct_copies(args.get("title", ""), args.get("authors", []))
            print(json.dumps(res))
        else:
            print(json.dumps({"status": "error", "message": f"Unknown action: {action}"}))
    except Exception as e:
        print(json.dumps({"status": "error", "message": f"Exception in main: {str(e)}"}))

if __name__ == "__main__":
    asyncio.run(main())
