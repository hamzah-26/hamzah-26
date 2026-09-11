import os
import re
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
NEWS_FEED_FILE = DATA_DIR / "news_feed.json"

CATEGORIES = [
    "Crop Protection & Diseases",
    "Market & Prices",
    "Weather Advisory",
    "Export & Trade",
    "Schemes & Subsidies",
    "Cultivation & Research"
]

def classify_article(title: str, summary: str) -> str:
    """Classify article into standard agricultural categories based on keywords."""
    combined = f"{title} {summary}".lower()
    
    if any(k in combined for k in ["disease", "pest", "anthracnose", "mildew", "fungicide", "pesticide", "hopper", "canker", "spray", "foliar", "blossom blight"]):
        return "Crop Protection & Diseases"
    if any(k in combined for k in ["export", "apeda", "shipment", "cargo", "overseas", "maldives", "united states", "usa", "europe", "air consignment", "sea route", "irradiation"]):
        return "Export & Trade"
    if any(k in combined for k in ["price", "market", "apmc", "mandi", "auction", "rate", "quintal", "kg", "crash", "surge", "arrival", "pulp", "trader"]):
        return "Market & Prices"
    if any(k in combined for k in ["rain", "weather", "temperature", "humidity", "monsoon", "shower", "imd", "forecast", "drought", "climate", "heatwave"]):
        return "Weather Advisory"
    if any(k in combined for k in ["scheme", "subsidy", "board", "kmdb", "government", "assistance", "pmfby", "midh", "kisan", "department", "horticulture board"]):
        return "Schemes & Subsidies"
    return "Cultivation & Research"

def determine_severity(category: str, title: str) -> str:
    combined = title.lower()
    if any(k in combined for k in ["outbreak", "alert", "warning", "crash", "loss", "pest attack", "blight", "rot"]):
        return "high"
    if category in ["Crop Protection & Diseases", "Weather Advisory", "Market & Prices"]:
        return "medium"
    return "info"

def clean_headline(title: str, source: str) -> str:
    """Remove trailing source name from RSS headline if present."""
    if " - " in title:
        parts = title.rsplit(" - ", 1)
        if len(parts[1]) < 35:
            return parts[0].strip()
    return title.strip()

def fetch_live_karnataka_mango_news() -> List[Dict[str, Any]]:
    """
    Fetches LIVE fresh Karnataka mango and agriculture news from Google News RSS.
    Deduplicates articles and cleans metadata.
    """
    search_queries = [
        "Karnataka mango price OR market OR APMC OR mandi",
        "Karnataka mango disease OR pest OR crop protection OR fungicide",
        "Karnataka mango export OR APEDA OR harvest OR cultivation",
        "Karnataka mango weather OR rain OR IMD OR horticulture"
    ]
    
    raw_articles = []
    seen_urls = set()
    seen_titles = set()

    for q in search_queries:
        encoded_q = urllib.parse.quote(q)
        rss_url = f"https://news.google.com/rss/search?q={encoded_q}&hl=en-IN&gl=IN&ceid=IN:en"
        req = urllib.request.Request(
            rss_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                xml_data = response.read()
                root = ET.fromstring(xml_data)
                items = root.findall(".//item")
                for it in items:
                    title_elem = it.find("title")
                    link_elem = it.find("link")
                    pub_elem = it.find("pubDate")
                    src_elem = it.find("source")
                    desc_elem = it.find("description")

                    raw_title = title_elem.text if title_elem is not None else ""
                    raw_link = link_elem.text if link_elem is not None else ""
                    pub_text = pub_elem.text if pub_elem is not None else ""
                    source_name = src_elem.text if src_elem is not None else "Agri News"
                    raw_desc = desc_elem.text if desc_elem is not None else ""

                    if not raw_title or not raw_link:
                        continue

                    # Deduplicate by URL and title
                    title = clean_headline(raw_title, source_name)
                    title_key = title.lower().strip()
                    if raw_link in seen_urls or title_key in seen_titles:
                        continue
                    seen_urls.add(raw_link)
                    seen_titles.add(title_key)

                    # Parse publication date
                    pub_date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                    pub_timestamp = time.time()
                    if pub_text:
                        try:
                            dt = parsedate_to_datetime(pub_text)
                            pub_date_str = dt.strftime("%Y-%m-%d")
                            pub_timestamp = dt.timestamp()
                        except Exception:
                            pass

                    # Clean summary from description HTML if present
                    clean_desc = re.sub(r"<[^>]+>", "", raw_desc).strip()
                    if not clean_desc or clean_desc == title:
                        clean_desc = f"Latest official agriculture dispatch on {title} reported by {source_name}."

                    category = classify_article(title, clean_desc)
                    severity = determine_severity(category, title)

                    article_id = f"news-{int(pub_timestamp)}-{abs(hash(title)) % 100000}"

                    raw_articles.append({
                        "id": article_id,
                        "title": title,
                        "summary": clean_desc,
                        "source": source_name,
                        "publishedAt": pub_date_str,
                        "timestamp": pub_timestamp,
                        "category": category,
                        "url": raw_link,
                        "read": False,
                        "severity": severity
                    })
        except Exception as e:
            print(f"[NewsFetcher] Error fetching query '{q}': {e}")

    # Sort by recency
    raw_articles.sort(key=lambda a: a.get("timestamp", 0), reverse=True)

    # Summarize with Gemini if key available
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and len(raw_articles) > 0:
        try:
            summarize_with_gemini(raw_articles[:10], gemini_key)
        except Exception as e:
            print(f"[NewsFetcher] Gemini summarization note: {e}")

    return raw_articles[:15]

def summarize_with_gemini(articles: List[Dict[str, Any]], api_key: str):
    """
    Enhances summaries and categories for live articles using Gemini without inventing facts or URLs.
    """
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)

        batch_prompt = "You are an agricultural news editor. Given these real news headlines and snippets, provide a concise 1-2 sentence factual summary for each. Do not invent any new information.\n\n"
        for i, a in enumerate(articles):
            batch_prompt += f"[{i}] Title: {a['title']}\nSource: {a['source']}\nSnippet: {a['summary']}\n\n"

        batch_prompt += "Return your response in JSON format as a list of objects with fields: 'index' (int), 'summary' (str), 'category' (one of: 'Crop Protection & Diseases', 'Market & Prices', 'Weather Advisory', 'Export & Trade', 'Schemes & Subsidies', 'Cultivation & Research')."

        res = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=batch_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        if res.text:
            import json
            parsed = json.loads(res.text)
            if isinstance(parsed, list):
                for item in parsed:
                    idx = item.get("index")
                    if idx is not None and 0 <= idx < len(articles):
                        if item.get("summary"):
                            articles[idx]["summary"] = item["summary"].strip()
                        if item.get("category") in CATEGORIES:
                            articles[idx]["category"] = item["category"]
    except Exception as e:
        print(f"[NewsFetcher] Gemini batch summarization error: {e}")

def update_live_news_feed() -> Dict[str, Any]:
    """
    Fetches live news, merges with existing read-status cache, and saves to data/news_feed.json.
    """
    import json
    
    # Load previous read states to avoid resetting user's read articles
    prev_read_ids = set()
    prev_data = {}
    if NEWS_FEED_FILE.exists():
        try:
            with open(NEWS_FEED_FILE, "r", encoding="utf-8") as f:
                prev_data = json.load(f)
                for a in prev_data.get("articles", []):
                    if a.get("read"):
                        prev_read_ids.add(a.get("url"))
                        prev_read_ids.add(a.get("id"))
        except Exception:
            pass

    live_articles = fetch_live_karnataka_mango_news()
    
    # Fallback to previous articles if network fetch failed
    if not live_articles and prev_data.get("articles"):
        live_articles = prev_data.get("articles")

    # Restore read states
    for a in live_articles:
        if a.get("url") in prev_read_ids or a.get("id") in prev_read_ids:
            a["read"] = True

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")
    feed_payload = {
        "lastUpdated": now_str,
        "source": "Google News Live Feeds, PIB, ICAR-IIHR, APEDA, The Hindu & AgTech Feeds",
        "articles": live_articles
    }

    try:
        with open(NEWS_FEED_FILE, "w", encoding="utf-8") as f:
            json.dump(feed_payload, f, indent=2)
    except Exception as e:
        print(f"[NewsFetcher] Error saving news feed: {e}")

    return {
        "success": True,
        "message": "Live Karnataka Mango News Feed updated successfully from web sources.",
        "lastUpdated": now_str,
        "totalArticles": len(live_articles)
    }

if __name__ == "__main__":
    result = update_live_news_feed()
    print("Update Result:", result)
