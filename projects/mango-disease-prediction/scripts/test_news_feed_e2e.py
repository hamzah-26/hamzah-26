import sys
from fastapi.testclient import TestClient

sys.path.insert(0, ".")
from backend.main import app

def test_news_feed_e2e():
    client = TestClient(app)

    print("=== 1. Testing GET /api/news (All Articles) ===")
    res = client.get("/api/news")
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    assert "articles" in data
    assert len(data["articles"]) > 0
    print("Total articles returned:", len(data["articles"]))
    print("Unread count:", data["unreadCount"])
    print("Categories available:", data["categories"])

    print("\n=== 2. Verifying Real Headline, Source, Date, and Exact URL Integrity ===")
    valid_domains = [
        "pib.gov.in",
        "iihr.res.in",
        "apeda.gov.in",
        "horticulturedir.karnataka.gov.in",
        "thehindubusinessline.com",
        "ncipm.icar.gov.in",
        "mausam.imd.gov.in",
        "midh.gov.in"
    ]
    for article in data["articles"]:
        assert article.get("title"), "Article missing title"
        assert article.get("summary"), "Article missing summary"
        assert article.get("source"), "Article missing source"
        assert article.get("publishedAt"), "Article missing publishedAt"
        assert article.get("category"), "Article missing category"
        assert article.get("url"), "Article missing url"
        
        # Verify genuine domain
        url = article["url"]
        assert url.startswith("https://"), f"URL must be HTTPS: {url}"
        has_valid_domain = any(domain in url for domain in valid_domains)
        assert has_valid_domain, f"Invalid domain in URL: {url}"
        print(f" [OK] [{article['category']}] ({article['source']}) -> {article['title'][:55]}...")
        print(f"      URL: {article['url']}")

    print("\n=== 3. Testing Category Filter: Crop Protection ===")
    res = client.get("/api/news?category=Crop%20Protection")
    assert res.status_code == 200
    cat_articles = res.json()["articles"]
    assert len(cat_articles) > 0
    for a in cat_articles:
        assert "Crop Protection" in a["category"]
    print("Filtered articles count:", len(cat_articles))

    print("\n=== 4. Testing Mark Single Article as Read ===")
    first_id = data["articles"][0]["id"]
    res = client.post(f"/api/news/read/{first_id}")
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Verify updated
    res2 = client.get("/api/news")
    updated_article = next(a for a in res2.json()["articles"] if a["id"] == first_id)
    assert updated_article["read"] is True
    print(f"Article {first_id} marked as read successfully!")

    print("\n=== 5. Testing Mark All as Read ===")
    res = client.post("/api/news/read-all")
    assert res.status_code == 200
    assert res.json()["success"] is True

    res_all_read = client.get("/api/news")
    assert res_all_read.json()["unreadCount"] == 0
    print("All articles marked read. Unread count:", res_all_read.json()["unreadCount"])

    print("\n=== 6. Testing Refresh News Feed ===")
    res = client.post("/api/news/refresh")
    assert res.status_code == 200
    assert res.json()["success"] is True
    print("News feed refreshed. Last updated:", res.json()["lastUpdated"])

    print("\nALL KARNATAKA MANGO NEWS FEED ENDPOINTS & DATA TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_news_feed_e2e()
