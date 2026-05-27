def test_register_success(client):
    res = client.post('/api/auth/register', json={
        'username': 'newuser',
        'password': 'password123'
    })
    assert res.status_code == 201
    assert res.get_json()['message'] == 'User registered successfully'

def test_register_duplicate(client):
    client.post('/api/auth/register', json={'username': 'duplicate', 'password': '123'})
    res = client.post('/api/auth/register', json={'username': 'duplicate', 'password': '456'})
    assert res.status_code == 409

def test_login_success(client):
    client.post('/api/auth/register', json={'username': 'logintest', 'password': 'password'})
    res = client.post('/api/auth/login', json={'username': 'logintest', 'password': 'password'})
    assert res.status_code == 200
    assert 'token' in res.get_json()['data']

def test_login_invalid(client):
    client.post('/api/auth/register', json={'username': 'logintest', 'password': 'password'})
    res = client.post('/api/auth/login', json={'username': 'logintest', 'password': 'wrong'})
    assert res.status_code == 401

def test_status_protected(client, auth_headers):
    # Without token
    res1 = client.get('/api/auth/status')
    assert res1.status_code == 401
    
    # With token
    res2 = client.get('/api/auth/status', headers=auth_headers)
    assert res2.status_code == 200
    assert res2.get_json()['data']['username'] == 'testuser'
