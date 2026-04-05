import requests

def test_upload(target, filepath):
    url = f"http://127.0.0.1:8000/api/import/{target}"
    with open(filepath, 'rb') as f:
        r = requests.post(url, files={'file': f})
        print(f"[{target}] Status: {r.status_code} | Response: {r.text}")

print("Testing API endpoints...")
test_upload("vendors", "demo_data/vendors_demo.xlsx")
test_upload("account-groups", "demo_data/account_groups_demo.xlsx")
test_upload("import-dict", "demo_data/import_dict_demo.xlsx")
# ledgers needs foreign keys to exist, so test it last
test_upload("ledgers", "demo_data/ledgers_demo.xlsx")
