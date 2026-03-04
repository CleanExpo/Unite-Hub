"""Mark a list of issue IDs as Done in Linear."""
import urllib.request, json, sys

import os
TOKEN = os.environ.get("LINEAR_API_KEY", "")
TEAM_ID = os.environ.get("LINEAR_TEAM_ID", "ab9c7810-4dd6-4ce2-8e8f-e1fc94c6b88b")

IDENTIFIERS = sys.argv[1:]  # e.g. UNI-888 UNI-868 ...

def gql(query, variables=None):
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        "https://api.linear.app/graphql",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": TOKEN}
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {body[:500]}")

# Get Done state ID
states_q = """
query($teamId: String!) {
  team(id: $teamId) {
    states { nodes { id name type } }
  }
}
"""
states_data = gql(states_q, {"teamId": TEAM_ID})
done_state = next(
    s for s in states_data["data"]["team"]["states"]["nodes"]
    if s["type"] == "completed" and s["name"].lower() == "done"
)
print(f"Done state: {done_state['name']} ({done_state['id']})")

# Fetch issue IDs by identifier
for identifier in IDENTIFIERS:
    q = """
    query($id: String!) {
      issue(id: $id) { id identifier title state { name } }
    }
    """
    result = gql(q, {"id": identifier})
    issue = result["data"]["issue"]
    print(f"  {issue['identifier']}: {issue['title'][:60]} [{issue['state']['name']}]")

    mutation = """
    mutation($id: String!, $stateId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId }) {
        success
        issue { identifier state { name } }
      }
    }
    """
    update = gql(mutation, {"id": issue["id"], "stateId": done_state["id"]})
    if update["data"]["issueUpdate"]["success"]:
        print("    -> Done OK")
    else:
        print("    -> FAILED")
