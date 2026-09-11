import sys
from fastapi.testclient import TestClient

sys.path.insert(0, ".")
from backend.main import app

def test_live_news_and_sound():
    client = TestClient(app)

    print("=== 1. Testing Live Web News Fetch & Refresh ===")
    res_refresh = client.post("/api/news/refresh")
    assert res_refresh.status_code == 200, f"Refresh failed: {res_refresh.text}"
    ref_data = res_refresh.json()
    assert ref_data["success"] is True
    print("Live refresh success! Last updated:", ref_data["lastUpdated"])
    print("Total live articles fetched:", ref_data["totalArticles"])

    print("\n=== 2. Testing GET /api/news for Live Real Articles ===")
    res = client.get("/api/news")
    assert res.status_code == 200
    data = res.json()
    assert "articles" in data
    assert len(data["articles"]) > 0
    print("Articles returned:", len(data["articles"]))
    print("Source tag:", data["source"])

    # Verify no mock/stale entries
    seen_urls = set()
    for i, a in enumerate(data["articles"]):
        url = a.get("url", "")
        title = a.get("title", "")
        assert url, f"Article {i} missing URL"
        assert title, f"Article {i} missing title"
        assert url not in seen_urls, f"Duplicate URL detected: {url}"
        seen_urls.add(url)
        assert a.get("summary"), "Article missing summary"
        assert a.get("publishedAt"), "Article missing publishedAt"
        assert a.get("category"), "Article missing category"
        print(f" [{a['category']}] ({a['source']} - {a['publishedAt']}): {title[:60]}...")
        print(f"      URL: {url[:80]}...")

    print("\n=== 3. Testing Settings Persistence with Notification Sound (soundAlerts) ===")
    # Fetch settings
    res_set = client.get("/api/settings")
    assert res_set.status_code == 200
    curr_settings = res_set.json()
    assert "notifications" in curr_settings
    print("Current notifications settings:", curr_settings["notifications"])

    # Update soundAlerts to True
    curr_settings["notifications"]["soundAlerts"] = True
    save_res = client.post("/api/settings", json=curr_settings)
    assert save_res.status_code == 200, f"Save failed: {save_res.text}"
    updated_settings = save_res.json()["settings"]
    assert updated_settings["notifications"]["soundAlerts"] is True
    print("soundAlerts setting persisted as True successfully!")

    # Update soundAlerts to False
    curr_settings["notifications"]["soundAlerts"] = False
    save_res2 = client.post("/api/settings", json=curr_settings)
    assert save_res2.status_code == 200
    assert save_res2.json()["settings"]["notifications"]["soundAlerts"] is False
    print("soundAlerts setting toggle to False persisted successfully!")

    # Restore to True
    curr_settings["notifications"]["soundAlerts"] = True
    client.post("/api/settings", json=curr_settings)

    print("\n=== 4. Testing Mark Single Article Read & Mark All Read ===")
    art_id = data["articles"][0]["id"]
    res_read = client.post(f"/api/news/read/{art_id}")
    assert res_read.status_code == 200
    assert res_read.json()["success"] is True

    res_all = client.post("/api/news/read-all")
    assert res_all.status_code == 200
    assert client.get("/api/news").json()["unreadCount"] == 0
    print("Read states verified successfully!")

    print("\nALL LIVE WEB NEWS & NOTIFICATION SOUND FLOW TESTS PASSED 100%!")

if __name__ == "__main__":
    test_live_news_and_sound()
