
import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def verify_profile_flow():
    # 1. Register a new user
    import uuid
    username = f"testuser_{uuid.uuid4().hex[:8]}"
    email = f"{username}@example.com"
    password = "password123"

    print(f"Registering user: {username} ({email})...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "username": username,
            "email": email,
            "password": password
        }, timeout=5)
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return False
    
    if resp.status_code != 201:
        # Try login if already exists (unlikely with random uuid but good practice)
        pass
    else:
        print("Registration successful.")

    # 2. Login
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": email,
        "password": password
    })
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return False
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 3. Get Profile (Initial)
    print("Fetching initial profile...")
    resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if resp.status_code != 200:
        print(f"Get profile failed: {resp.text}")
        return False
    user = resp.json()
    print(f"Initial profile: {user.get('bio')}, {user.get('location')}")

    # 4. Update Profile
    print("Updating profile...")
    update_data = {
        "bio": "I am a test user.",
        "location": "Test City, TS",
        "website_url": "https://test.com",
        "github_url": "github.com/test",
        "linkedin_url": "linkedin.com/in/test",
        "avatar_url": "https://test.com/avatar.png"
    }
    resp = requests.put(f"{BASE_URL}/auth/me", headers=headers, json=update_data)
    if resp.status_code != 200:
        print(f"Update profile failed: {resp.text}")
        return False
    
    updated_user = resp.json()
    
    # Verify updates in response
    for key, value in update_data.items():
        if updated_user.get(key) != value:
            print(f"Mismatch for {key}: expected {value}, got {updated_user.get(key)}")
            return False
    
    print("Update response verified.")

    # 5. Get Profile (Verify Persistence)
    print("Fetching profile again to verify persistence...")
    resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if resp.status_code != 200:
        print(f"Get profile failed: {resp.text}")
        return False
    final_user = resp.json()

    for key, value in update_data.items():
        if final_user.get(key) != value:
            print(f"Persistence check failed for {key}: expected {value}, got {final_user.get(key)}")
            return False

    print("Profile verification successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_profile_flow():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)
