def test_schedule_review(client):
    response = client.post(
        "/api/review/schedule",
        json={
            "user_id": 1,
            "topic_id": 101,
            "rating": 4
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "next_review_date" in data
    assert data["ease_factor"] >= 2.5
    assert data["interval_days"] > 0

def test_get_pending_reviews(client):
    response = client.get("/api/review/pending")
    assert response.status_code == 200
    data = response.json()
    assert "reviews" in data
    assert len(data["reviews"]) > 0
    assert "topic" in data["reviews"][0]
