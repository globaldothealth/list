import pytest
from src.app import main

# see: http://flask.pocoo.org/docs/1.0/testing/
@pytest.fixture
def client():
    main.app.config['TESTING'] = True
    client = main.app.test_client()
    yield client

def test_info(client):
    response = client.get('/health')
    result = response.get_json()
    assert result is not None
    assert "status" in result
    assert result["status"] == "Healthy"