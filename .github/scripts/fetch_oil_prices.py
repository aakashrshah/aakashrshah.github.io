"""
fetch_oil_prices.py
Combines /tmp/wti_raw.json and /tmp/brent_raw.json into
dashboard/data/oil-prices.json.

Called by .github/workflows/fetch-oil-prices.yml after the curl steps.
"""
import json
import datetime
import os
import sys


def load(path):
    with open(path) as f:
        return json.load(f)


def validate(name, data):
    keys = list(data.keys())
    if "data" in data:
        latest = data["data"][0]
        print(f"{name} response keys: {keys}")
        print(f"{name} data points:   {len(data['data'])}")
        print(f"{name} most recent:   {latest}")
        return True
    if "Information" in data:
        print(f"ERROR [{name}] -- Rate limit hit: {data['Information'][:200]}")
    else:
        print(f"ERROR [{name}] -- Unexpected response. Keys: {keys}")
    return False


wti = load("/tmp/wti_raw.json")
brent = load("/tmp/brent_raw.json")

wti_ok = validate("WTI", wti)
brent_ok = validate("Brent", brent)

if not (wti_ok and brent_ok):
    sys.exit(1)

output = {
    "updated_at": datetime.datetime.utcnow().isoformat() + "Z",
    "wti": wti,
    "brent": brent,
}

os.makedirs("dashboard/data", exist_ok=True)
with open("dashboard/data/oil-prices.json", "w") as f:
    json.dump(output, f, indent=2)

wti_latest = wti["data"][0]
brent_latest = brent["data"][0]
print("SUCCESS")
print(f"  WTI:   {wti_latest['date']} = ${wti_latest['value']}/bbl")
print(f"  Brent: {brent_latest['date']} = ${brent_latest['value']}/bbl")
print("  Written to dashboard/data/oil-prices.json")
