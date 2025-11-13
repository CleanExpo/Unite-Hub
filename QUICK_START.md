# Client Management System - Quick Start

## Initialize Demo Environment

### Using API Endpoint (Recommended)
```bash
curl -X POST http://localhost:3000/api/demo/initialize
```

### Check Demo Status
```bash
curl http://localhost:3000/api/demo/initialize
```

---

## Access Demo Client

**Duncan's Tea House**
- Owner: Duncan MacDonald
- Email: duncan@duncansteahouse.com
- Package: Professional
- Status: Active

**Includes:**
- Customer Persona (Tea Enthusiast Emma)
- Marketing Strategy
- 7 Content Calendar Posts

---

## Common Operations

### List Clients
```typescript
const clients = await convex.query(api.clients.listByOrg, {
  orgId: myOrgId,
  status: "active",
});
```

### Create Client
```typescript
const clientId = await convex.mutation(api.clients.create, {
  orgId: myOrgId,
  clientName: "John Smith",
  businessName: "Smith's Coffee",
  businessDescription: "Artisan coffee shop",
  packageTier: "starter",
  primaryEmail: "john@smithscoffee.com",
  phoneNumbers: ["+1-555-0199"],
});
```

---

## Testing
```bash
node scripts/test-demo-init.js
```

---

Ready to build! 🚀
