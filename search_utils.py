import sys
import requests
import json
from datetime import datetime
from duckduckgo_search import DDGS

def search_duckduckgo(query: str, max_results: int = 5, search_news: bool = False) -> list:
    """
    Performs a free search using DuckDuckGo.
    Supports standard web text search or news search.
    """
    results = []
    try:
        with DDGS() as ddgs:
            if search_news:
                # ddgs.news returns news items with title, url, source, date, body
                raw_results = list(ddgs.news(query, max_results=max_results))
                for r in raw_results:
                    results.append({
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "snippet": r.get("body", ""),
                        "source": r.get("source", "DuckDuckGo News"),
                        "date": r.get("date", "")
                    })
            else:
                # ddgs.text returns web pages with title, href, body
                raw_results = list(ddgs.text(query, max_results=max_results))
                for r in raw_results:
                    results.append({
                        "title": r.get("title", ""),
                        "url": r.get("href", ""),
                        "snippet": r.get("body", ""),
                        "source": "DuckDuckGo Search",
                        "date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
                    })
    except Exception as e:
        print(f"Error performing DuckDuckGo search: {e}", file=sys.stderr)
        # Fallback to empty results
        results = []
    return results

def search_tavily(query: str, api_key: str, max_results: int = 5) -> list:
    """
    Performs a search using Tavily API (requires free or paid API key).
    """
    if not api_key:
        return []
    
    url = "https://api.tavily.com/search"
    headers = {"Content-Type": "application/json"}
    payload = {
        "api_key": api_key,
        "query": query,
        "search_depth": "news" if "news" in query.lower() else "basic",
        "max_results": max_results,
        "include_answer": False,
        "include_raw_content": False
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for r in data.get("results", []):
            results.append({
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "snippet": r.get("content", ""),
                "source": "Tavily",
                "date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S")  # Tavily doesn't always return standard date
            })
        return results
    except Exception as e:
        print(f"Error performing Tavily search: {e}", file=sys.stderr)
        return []

def get_fund_news_and_web(query: str, search_engine: str = "DuckDuckGo", api_key: str = "", max_results: int = 5) -> list:
    """
    Unified function to search for ETF/mutual fund info based on choice.
    """
    if search_engine == "Tavily" and api_key:
        return search_tavily(query, api_key, max_results)
    else:
        # Default to DuckDuckGo (standard search + news search merged or standard news search)
        news_results = search_duckduckgo(query, max_results=max_results, search_news=True)
        if len(news_results) < max_results:
            # Supplement with web search if news is scarce
            web_results = search_duckduckgo(query, max_results=(max_results - len(news_results)), search_news=False)
            news_results.extend(web_results)
        return news_results[:max_results]
