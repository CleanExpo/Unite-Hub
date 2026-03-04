"""Get full details of Linear issues by identifier."""
import urllib.request, json, sys

import os
TOKEN = os.environ.get("LINEAR_API_KEY", "")

def gql(query, variables=None):
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        "https://api.linear.app/graphql",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": TOKEN}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

for identifier in sys.argv[1:]:
    q = """
    query($id: String!) {
      issue(id: $id) {
        id identifier title priority
        description
        state { name type }
        labels { nodes { name } }
      }
    }
    """
    result = gql(q, {"id": identifier})
    issue = result["data"]["issue"]
    print(f"\n{'='*60}")
    print(f"{issue['identifier']}: {issue['title']}")
    print(f"State: {issue['state']['name']} | Priority: {issue['priority']}")
    labels = [n["name"] for n in issue["labels"]["nodes"]]
    if labels:
        print(f"Labels: {', '.join(labels)}")
    desc = (issue.get("description") or "").encode("ascii", "replace").decode()
    print(f"\nDescription:\n{desc[:2000]}")
