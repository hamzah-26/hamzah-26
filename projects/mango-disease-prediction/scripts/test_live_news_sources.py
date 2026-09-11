import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json
import os
from dotenv import load_dotenv
load_dotenv()

# 1. Test Google News RSS for Karnataka mango & agriculture queries
queries = [
    "Karnataka mango price OR market OR APMC",
    "Karnataka mango pest OR disease OR crop protection",
    "Karnataka mango export OR harvest OR cultivation OR weather"
]

print("--- Testing Live Google News RSS Feeds ---")
articles = []
for q in queries:
    url = f"https://news.google.com/rss/search?q={urllib.parse.quote(q)}&hl=en-IN&gl=IN&ceid=IN:en"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)
            items = root.findall('.//item')
            print(f"Query: '{q}' -> found {len(items)} items")
            for it in items[:3]:
                title = it.find('title').text if it.find('title') is not None else ""
                link = it.find('link').text if it.find('link') is not None else ""
                pubDate = it.find('pubDate').text if it.find('pubDate') is not None else ""
                source = it.find('source').text if it.find('source') is not None else "News"
                print(f"  * [{source}] ({pubDate}): {title}")
                print(f"    Link: {link}")
    except Exception as e:
        print(f"Error fetching '{q}': {e}")

# 2. Test Gemini Search Grounding if available
print("\n--- Testing Gemini with Search Tool ---")
try:
    from google import genai
    from google.genai import types
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents='What are the latest news articles in the last 72 hours or week regarding Karnataka mango prices, markets, pests, or cultivation? List the article headlines, dates, sources, and original URLs.',
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )
        print("Gemini Search Response received:")
        print(response.text[:500])
        if hasattr(response, 'candidates') and response.candidates:
            cand = response.candidates[0]
            if hasattr(cand, 'grounding_metadata'):
                print("Grounding metadata found!")
                print(cand.grounding_metadata)
    else:
        print("No GEMINI_API_KEY")
except Exception as e:
    print(f"Gemini grounding test note: {e}")
