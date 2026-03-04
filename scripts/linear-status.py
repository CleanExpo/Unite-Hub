import urllib.request, json, sys

import os
token = os.environ.get("LINEAR_API_KEY", "")
team_id = os.environ.get("LINEAR_TEAM_ID", "ab9c7810-4dd6-4ce2-8e8f-e1fc94c6b88b")

query = """
query($teamId: String!, $after: String) {
  team(id: $teamId) {
    issues(
      filter: { state: { type: { in: ["unstarted", "started"] } } }
      orderBy: createdAt
      first: 50
      after: $after
    ) {
      nodes {
        id identifier title priority state { name type }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}
"""

all_issues = []
after = None
while True:
    payload = json.dumps({"query": query, "variables": {"teamId": team_id, "after": after}}).encode()
    req = urllib.request.Request(
        "https://api.linear.app/graphql",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": token}
    )
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
    issues_data = data["data"]["team"]["issues"]
    all_issues.extend(issues_data["nodes"])
    if not issues_data["pageInfo"]["hasNextPage"]:
        break
    after = issues_data["pageInfo"]["endCursor"]

priority_map = {0: "Urgent", 1: "High", 2: "Medium", 3: "Low", 4: "None"}
started = [i for i in all_issues if i["state"]["type"] == "started"]
unstarted = [i for i in all_issues if i["state"]["type"] == "unstarted"]

print(f"IN PROGRESS ({len(started)}):")
for i in sorted(started, key=lambda x: x["priority"]):
    title = i["title"].encode("ascii", "replace").decode()[:75]
    print(f"  [{priority_map.get(i['priority'], '?')}] {i['identifier']}: {title}")

print(f"\nTODO ({len(unstarted)}):")
for i in sorted(unstarted, key=lambda x: x["priority"]):
    title = i["title"].encode("ascii", "replace").decode()[:75]
    print(f"  [{priority_map.get(i['priority'], '?')}] {i['identifier']}: {title}")

print(f"\nTotal open: {len(all_issues)}")
