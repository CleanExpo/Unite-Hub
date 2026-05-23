import { describe, expect, it } from "vitest";

import { qualifyLead, type LeadQualificationBand } from "../qualify-lead";

describe("qualifyLead", () => {
  it("qualifies a consented lead with strong business signals", () => {
    const result = qualifyLead({
      email: "founder@acmeindustrial.com.au",
      phone: "+61 400 123 456",
      company: "Acme Industrial",
      jobTitle: "Operations Director",
      message:
        "We need a CRM and automation partner for a multi-site rollout this quarter.",
      interests: ["CRM implementation", "marketing automation"],
      marketingConsent: true,
      referralSource: "Partner referral",
      source: "website",
    });

    expect(result.recommendationOnly).toBe(true);
    expect(result.band satisfies LeadQualificationBand).toBe("qualified");
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.reasons).toContain("Has company and direct contact path");
    expect(result.reasons).toContain("Marketing consent provided");
    expect(result.reasons).not.toContain("founder@acmeindustrial.com.au");
  });

  it("nurtures a consented lead with partial signal and low detail", () => {
    const result = qualifyLead({
      email: "hello@smallbusiness.com.au",
      company: "Small Business Co",
      message: "Interested in learning more.",
      marketingConsent: true,
      source: "newsletter",
    });

    expect(result.recommendationOnly).toBe(true);
    expect(result.band).toBe("nurture");
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(75);
    expect(result.reasons).toContain("Marketing consent provided");
    expect(result.reasons).toContain("Limited qualification detail");
  });

  it("marks useful but non-consented leads as needing review", () => {
    const result = qualifyLead({
      email: "procurement@manufacturer.com.au",
      phone: "+61 2 9000 0000",
      company: "Manufacturer Pty Ltd",
      jobTitle: "Procurement Manager",
      message:
        "Please assess our CRM migration options and integration requirements.",
      interests: ["CRM migration"],
      marketingConsent: false,
      source: "contact_form",
    });

    expect(result.band).toBe("needs_review");
    expect(result.score).toBeGreaterThanOrEqual(45);
    expect(result.score).toBeLessThan(75);
    expect(result.reasons).toContain("Marketing consent missing");
    expect(result.reasons).toContain("Manual review required before outreach");
  });

  it("flags spam risk for disposable/example/test domains and spammy messages", () => {
    const result = qualifyLead({
      email: "winner@example.com",
      message:
        "Crypto casino loan offer https://one.example https://two.example https://three.example",
      marketingConsent: true,
      source: "web",
    });

    expect(result.band).toBe("spam_risk");
    expect(result.score).toBeLessThan(40);
    expect(result.reasons).toContain("Email domain is disposable or test-like");
    expect(result.reasons).toContain("Message contains spam-like terms");
    expect(result.reasons).toContain("Message is URL-heavy");
    expect(result.reasons.join(" ")).not.toContain("winner@example.com");
  });

  it("flags missing real contact path as spam risk", () => {
    const result = qualifyLead({
      company: "No Contact Pty Ltd",
      message: "We might need help soon.",
      marketingConsent: true,
    });

    expect(result.band).toBe("spam_risk");
    expect(result.score).toBeLessThan(40);
    expect(result.reasons).toContain("Missing real contact path");
  });

  it("is deterministic and does not expose authorization beyond recommendation", () => {
    const input = {
      email: "lead@agency.com.au",
      phone: "0400 000 000",
      company: "Agency Co",
      message: "Need help evaluating CRM automation options.",
      interests: ["automation"],
      marketingConsent: true,
    };

    expect(qualifyLead(input)).toEqual(qualifyLead(input));
    expect(Object.keys(qualifyLead(input)).sort()).toEqual([
      "band",
      "reasons",
      "recommendationOnly",
      "score",
    ]);
  });
});
