import sys
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.insert(0, ".")
from backend.main import app

def test_market_endpoints():
    client = TestClient(app)

    print("=== 1. Testing GET /api/market/karnataka (All Records) ===")
    res = client.get("/api/market/karnataka")
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    assert "records" in data
    assert len(data["records"]) > 0
    print("Returned records:", len(data["records"]))
    print("Source tag:", data.get("source"))
    print("State average price/kg: Rs.", data["summary"]["stateAveragePricePerKg"])
    print("Top gainer:", data["summary"]["topGainer"])

    print("\n=== 2. Testing Variety Filter (Badami) ===")
    res = client.get("/api/market/karnataka?variety=Badami")
    assert res.status_code == 200
    records = res.json()["records"]
    print("Badami records count:", len(records))
    for r in records:
        assert "Badami" in r["variety"]
        print(f" - {r['variety']} @ {r['market']}: Rs. {r['pricePerKgAvg']}/kg ({r['priceChange']} pct) [{r['direction']}]")

    print("\n=== 3. Testing District Filter (Kolar) ===")
    res = client.get("/api/market/karnataka?district=Kolar")
    assert res.status_code == 200
    records = res.json()["records"]
    print("Kolar records count:", len(records))
    for r in records:
        assert r["district"] == "Kolar"

    print("\n=== 4. Testing Sorting (Price Descending) ===")
    res = client.get("/api/market/karnataka?sort_by=price_desc")
    assert res.status_code == 200
    records = res.json()["records"]
    prices = [r["avgPrice"] for r in records]
    assert prices == sorted(prices, reverse=True)
    print("Top price:", records[0]["variety"], "@", records[0]["market"], "Rs.", records[0]["pricePerKgAvg"], "/kg")

    print("\n=== 5. Testing GET /api/market/karnataka/trends (30-Day) ===")
    res = client.get("/api/market/karnataka/trends?variety=Badami&days=30")
    assert res.status_code == 200
    trends = res.json()
    assert "points" in trends
    assert len(trends["points"]) > 0
    print("Trends for:", trends["variety"])
    print("Points count:", len(trends["points"]))
    print("Start price/kg:", trends["startPricePerKg"], "Current price/kg:", trends["currentPricePerKg"])
    print("Period percentage change:", trends["percentageChange"], f"pct [{trends['trendDirection']}]")

    print("\n=== 6. Testing GET /api/market/karnataka/trends (7-Day) ===")
    res = client.get("/api/market/karnataka/trends?variety=Totapuri&days=7")
    assert res.status_code == 200
    trends7 = res.json()
    print("7-day Totapuri change:", trends7["percentageChange"], "pct")

    print("\n=== 7. Testing POST /api/market/karnataka/refresh ===")
    res = client.post("/api/market/karnataka/refresh")
    assert res.status_code == 200
    assert res.json()["success"] is True
    print("Refresh success! Last synced:", res.json()["lastSynced"])

    print("\nALL KARNATAKA MANGO MARKET BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_market_endpoints()
