import urllib.request
import json
import argparse
from typing import List, Dict, Any

DEFAULT_API_BASE = "http://localhost:5000/api"

def analyze_text(text: str, api_base: str = DEFAULT_API_BASE) -> Dict[str, Any]:
    """Sends text to the backend for social engineering analysis.
    
    Replicates JS: analyzeText(text)
    """
    url = f"{api_base}/analyze"
    headers = {"Content-Type": "application/json"}
    payload = json.dumps({"text": text}).encode("utf-8")
    
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("report", {})
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
            raise Exception(err_json.get("error", "HTTP Error occurred"))
        except json.JSONDecodeError:
            raise Exception(f"HTTP Error {e.code}: {e.reason}")
    except Exception as e:
        raise Exception(f"Failed to reach API: {e}")

def fetch_history(api_base: str = DEFAULT_API_BASE) -> List[Dict[str, Any]]:
    """Fetches recent analysis history from the backend.
    
    Replicates JS: fetchHistory()
    """
    url = f"{api_base}/history"
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("history", [])
    except Exception as e:
        raise Exception(f"Failed to fetch history: {e}")

def fetch_stats(api_base: str = DEFAULT_API_BASE) -> Dict[str, Any]:
    """Fetches general API runtime statistics."""
    url = f"{api_base}/stats"
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        raise Exception(f"Failed to fetch stats: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SE Defense API - Python Client CLI")
    parser.add_argument("--action", choices=["analyze", "history", "stats"], default="analyze", help="Action to perform")
    parser.add_argument("--text", type=str, help="Text to analyze (required for 'analyze' action)")
    parser.add_argument("--api-base", type=str, default=DEFAULT_API_BASE, help="Base API URL")
    
    args = parser.parse_args()
    
    try:
        if args.action == "analyze":
            if not args.text:
                parser.error("--text is required when action is 'analyze'")
            print(f"Analyzing text: '{args.text}'...\n")
            report = analyze_text(args.text, args.api_base)
            print(json.dumps(report, indent=2))
        elif args.action == "history":
            print("Fetching analysis history...\n")
            history = fetch_history(args.api_base)
            print(json.dumps(history, indent=2))
        elif args.action == "stats":
            print("Fetching server statistics...\n")
            stats = fetch_stats(args.api_base)
            print(json.dumps(stats, indent=2))
    except Exception as e:
        print(f"Error: {e}")
