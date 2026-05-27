def test_create_bookmark(client, auth_headers):
    res = client.post('/api/bookmarks', headers=auth_headers, json={
        'url': 'https://example.com',
        'title': 'Example Site',
        'tags': ['test', 'example']
    })
    assert res.status_code == 201
    data = res.get_json()['data']['bookmark']
    assert data['url'] == 'https://example.com'
    assert data['title'] == 'Example Site'
    assert 'test' in data['tags']

def test_create_bookmark_invalid_url(client, auth_headers):
    res = client.post('/api/bookmarks', headers=auth_headers, json={
        'url': 'not-a-url',
        'title': 'Example Site'
    })
    assert res.status_code == 400

def test_get_bookmarks(client, auth_headers):
    client.post('/api/bookmarks', headers=auth_headers, json={
        'url': 'https://example.com/1',
        'title': 'Site 1'
    })
    
    res = client.get('/api/bookmarks', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()['data']
    assert len(data['items']) == 1
    assert data['items'][0]['title'] == 'Site 1'

def test_delete_bookmark(client, auth_headers):
    res = client.post('/api/bookmarks', headers=auth_headers, json={
        'url': 'https://example.com/delete',
        'title': 'Delete Me'
    })
    bm_id = res.get_json()['data']['bookmark']['id']
    
    del_res = client.delete(f'/api/bookmarks/{bm_id}', headers=auth_headers)
    assert del_res.status_code == 200
    
    get_res = client.get('/api/bookmarks', headers=auth_headers)
    assert len(get_res.get_json()['data']['items']) == 0
