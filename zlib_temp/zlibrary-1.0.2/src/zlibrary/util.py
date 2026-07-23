import aiohttp
import asyncio

from aiohttp_socks import ChainProxyConnector

from .exception import LoopError
from .logger import logger
from aiohttp.abc import AbstractCookieJar
from typing import Tuple


HEAD = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36"
}


TIMEOUT = aiohttp.ClientTimeout(total=180, connect=0, sock_connect=120, sock_read=180)

HEAD_TIMEOUT = aiohttp.ClientTimeout(total=4, connect=0, sock_connect=4, sock_read=4)


async def GET_request(url, cookies=None, proxy_list=None) -> str:
    try:
        import re
        async with aiohttp.ClientSession(
            headers=HEAD,
            cookie_jar=aiohttp.CookieJar(unsafe=True),
            cookies=cookies,
            timeout=TIMEOUT,
            connector=ChainProxyConnector.from_urls(proxy_list) if proxy_list else None,
        ) as sess:
            logger.info("GET %s" % url)
            async with sess.get(url) as resp:
                html = await resp.text()
                
                # Check for JS fingerprint redirection
                match = re.search(r"var redirect_link\s*=\s*'([^']+)';", html)
                if match:
                    redirect_url = match.group(1) + "fp=-3"
                    if redirect_url.startswith("http://"):
                        redirect_url = "https://" + redirect_url[7:]
                    logger.info("Detected JS fingerprint redirect, following to %s" % redirect_url)
                    try:
                        async with sess.get(redirect_url) as resp2:
                            return await resp2.text()
                    except Exception as e:
                        logger.error("Fingerprint redirect follow failed: %s" % str(e))
                return html
    except asyncio.exceptions.CancelledError:
        raise LoopError("Asyncio loop has been closed before request could finish.")


async def GET_request_cookies(
    url, cookies=None, proxy_list=None
) -> Tuple[str, AbstractCookieJar]:
    try:
        async with aiohttp.ClientSession(
            headers=HEAD,
            cookie_jar=aiohttp.CookieJar(unsafe=True),
            cookies=cookies,
            timeout=TIMEOUT,
            connector=ChainProxyConnector.from_urls(proxy_list) if proxy_list else None,
        ) as sess:
            logger.info("GET %s" % url)
            async with sess.get(url) as resp:
                return (await resp.text(), sess.cookie_jar)
    except asyncio.exceptions.CancelledError:
        raise LoopError("Asyncio loop has been closed before request could finish.")


async def POST_request(url, data, proxy_list=None):
    try:
        async with aiohttp.ClientSession(
            headers=HEAD,
            timeout=TIMEOUT,
            cookie_jar=aiohttp.CookieJar(unsafe=True),
            connector=ChainProxyConnector.from_urls(proxy_list) if proxy_list else None,
        ) as sess:
            logger.info("POST %s" % url)
            async with sess.post(url, data=data) as resp:
                return (await resp.text(), sess.cookie_jar)
    except asyncio.exceptions.CancelledError:
        raise LoopError("Asyncio loop has been closed before request could finish.")


async def HEAD_request(url, proxy_list=None):
    try:
        async with aiohttp.ClientSession(
            headers=HEAD,
            timeout=HEAD_TIMEOUT,
            connector=ChainProxyConnector.from_urls(proxy_list) if proxy_list else None,
        ) as sess:
            logger.info("Checking connectivity of %s..." % url)
            async with sess.head(url) as resp:
                return resp.status
    except asyncio.exceptions.CancelledError:
        raise LoopError("Asyncio loop has been closed before request could finish.")
    except asyncio.exceptions.TimeoutError:
        return 0
