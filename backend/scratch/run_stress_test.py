import time
import requests
import tracemalloc
import sys

BASE_URL = 'http://localhost:5000/api'

def run_stress_test(filename):
    print("==================================================")
    print(f"🚀 STARTING STRESS TEST WITH: {filename}")
    print("==================================================")
    
    # 1. Start memory tracing
    tracemalloc.start()
    
    # 2. Register/Login a dedicated stress test user
    username = f"stress_user_{int(time.time())}"
    password = "StressPassword123!"
    
    print("1. Creating temporary stress test user...")
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "username": username,
        "password": password,
        "email": f"{username}@example.com"
    })
    
    if reg_res.status_code != 201:
        print(f"❌ Registration failed: {reg_res.json()}")
        sys.exit(1)
        
    print("2. Authenticating user...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": username,
        "password": password
    })
    
    if login_res.status_code != 200:
        print(f"❌ Login failed: {login_res.json()}")
        sys.exit(1)
        
    token = login_res.json()['token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Perform the Import and measure time/memory
    print("3. Uploading and importing 10,000 bookmarks...")
    start_time = time.time()
    
    try:
        with open(filename, 'rb') as f:
            files = {'file': (filename, f, 'text/html')}
            response = requests.post(f"{BASE_URL}/import", headers=headers, files=files)
            
        end_time = time.time()
        elapsed_time = end_time - start_time
        
        # Get peak memory
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        if response.status_code == 200:
            data = response.json()
            summary = data.get('summary', {})
            imported = summary.get('imported', 0)
            skipped = summary.get('skipped_duplicates', 0)
            
            print("\n================ METRICS REPORT ================")
            print(f"⏱️  Total Processing Time : {elapsed_time:.2f} seconds")
            print(f"💾 Peak Memory Usage     : {peak / 10**6:.2f} MB")
            print(f"📥 Bookmarks Imported    : {imported}")
            print(f"🔄 Duplicates Skipped    : {skipped}")
            print(f"⚡ Avg Speed             : {imported / elapsed_time:.2f} bookmarks/sec")
            print("================================================")
            print("🎉 Stress test successfully completed!")
        else:
            print(f"❌ Import failed with status {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Error during stress test: {e}")
        tracemalloc.stop()

if __name__ == "__main__":
    import os
    file_path = "stress_test_10k.html"
    if not os.path.exists(file_path):
        # Fallback to backend root if run from scratch dir
        file_path = os.path.join("..", file_path)
        if not os.path.exists(file_path):
            print("❌ stress_test_10k.html not found! Please run generate_bookmarks.py first.")
            sys.exit(1)
            
    run_stress_test(file_path)
