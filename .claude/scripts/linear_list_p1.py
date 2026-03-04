import sys, json, urllib.request, urllib.error
sys.stdout.reconfigure(encoding='utf-8')

env = open('.env.local').read()
token = [l.split('=',1)[1].strip().strip('"') for l in env.splitlines() if 'LINEAR_API_KEY' in l][0]

query = """
{
  issues(
    filter: { team: { key: { eq: "UNI" } } }
    orderBy: createdAt
    first: 100
  ) {
    nodes {
      identifier
      title
      priority
      state { name type }
    }
  }
}
"""

payload = json.dumps({"query": query}).encode()
req = urllib.request.Request(
    'https://api.linear.app/graphql',
    payload,
    {'Authorization': token, 'Content-Type': 'application/json'}
)
try:
    resp = urllib.request.urlopen(req).read()
    data = json.loads(resp)
    if 'errors' in data:
        print("GQL ERRORS:", data['errors'])
    else:
        issues = [i for i in data['data']['issues']['nodes']
                  if i['state']['type'] not in ('completed', 'cancelled') and i['priority'] <= 2]
        issues.sort(key=lambda x: x['priority'])
        for i in issues:
            p_label = ['No', 'Urgent', 'High', 'Medium', 'Low'][i['priority']]
            print(f"[{p_label}] {i['identifier']}: {i['title'][:70]} [{i['state']['name']}]")
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code, e.read().decode('utf-8', errors='replace'))
