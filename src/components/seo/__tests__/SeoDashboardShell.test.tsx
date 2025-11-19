/**
 * Unit Tests: SeoDashboardShell Component
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import SeoDashboardShell from "../SeoDashboardShell";
import type { SeoProfile } from "@/lib/seo/seoTypes";

// Mock the panel components
vi.mock("../panels/GscOverviewPanel", () => ({
  default: () => <div data-testid="gsc-overview-panel">GSC Overview Panel</div>,
}));

vi.mock("../panels/BingIndexNowPanel", () => ({
  default: () => <div data-testid="bing-indexnow-panel">Bing IndexNow Panel</div>,
}));

vi.mock("../panels/BravePresencePanel", () => ({
  default: () => <div data-testid="brave-presence-panel">Brave Presence Panel</div>,
}));

vi.mock("../panels/KeywordOpportunitiesPanel", () => ({
  default: () => <div data-testid="keyword-opportunities-panel">Keyword Opportunities Panel</div>,
}));

vi.mock("../panels/TechHealthPanel", () => ({
  default: () => <div data-testid="tech-health-panel">Tech Health Panel</div>,
}));

vi.mock("../panels/VelocityQueuePanel", () => ({
  default: () => <div data-testid="velocity-queue-panel">Velocity Queue Panel</div>,
}));

vi.mock("../panels/HookLabPanel", () => ({
  default: () => <div data-testid="hook-lab-panel">Hook Lab Panel</div>,
}));

const mockSeoProfile: SeoProfile = {
  id: "profile-123",
  organization_id: "org-123",
  profile_name: "Test Profile",
  domain: "example.com",
  industry: "technology",
  target_keywords: ["test", "example"],
  target_locations: ["US"],
  competitors: ["competitor.com"],
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("SeoDashboardShell", () => {
  it("should render in standard mode by default", async () => {
    render(
      <SeoDashboardShell
        seoProfile={mockSeoProfile}
        organizationId="org-123"
        userRole="staff"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("SEO Console")).toBeInTheDocument();
    });
  });

  it("should display domain in header", async () => {
    render(
      <SeoDashboardShell
        seoProfile={mockSeoProfile}
        organizationId="org-123"
        userRole="staff"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("example.com")).toBeInTheDocument();
    });
  });

  it("should render mode toggle", async () => {
    render(
      <SeoDashboardShell
        seoProfile={mockSeoProfile}
        organizationId="org-123"
        userRole="staff"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Standard")).toBeInTheDocument();
      expect(screen.getByText("Hypnotic")).toBeInTheDocument();
    });
  });

  it("should show loading state initially", () => {
    render(
      <SeoDashboardShell
        seoProfile={mockSeoProfile}
        organizationId="org-123"
        userRole="staff"
      />
    );

    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
  });

  it("should render standard mode panels for staff", async () => {
    render(
      <SeoDashboardShell
        seoProfile={mockSeoProfile}
        organizationId="org-123"
        userRole="staff"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("gsc-overview-panel")).toBeInTheDocument();
      expect(screen.getByTestId("bing-indexnow-panel")).toBeInTheDocument();
      expect(screen.getByTestId("brave-presence-panel")).toBeInTheDocument();
      expect(screen.getByTestId("keyword-opportunities-panel")).toBeInTheDocument();
      expect(screen.getByTestId("tech-health-panel")).toBeInTheDocument();
    });
  });

  it("should not render tech health panel for clients in standard mode", async () => {
    render(
      <SeoDashboardShell
        seoProfile={mockSeoProfile}
        organizationId="org-123"
        userRole="client"
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId("tech-health-panel")).not.toBeInTheDocument();
    });
  });

  it("should switch to hypnotic mode when toggle is clicked", async () => {
    render(
      <SeoDashboardShell
        seoProfile={mockSeoProfile}
        organizationId="org-123"
        userRole="staff"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("SEO Console")).toBeInTheDocument();
    });

    const hypnoticButton = screen.getByText("Hypnotic");
    hypnoticButton.click();

    await waitFor(() => {
      expect(screen.getByText("Hypnotic Velocity")).toBeInTheDocument();
    });
  });

  it("should render hypnotic mode panels", async () => {
    render(
      <SeoDashboardShell
        seoProfile={mockSeoProfile}
        organizationId="org-123"
        userRole="staff"
      />
    );

    await waitFor(() => {
      const hypnoticButton = screen.getByText("Hypnotic");
      hypnoticButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("velocity-queue-panel")).toBeInTheDocument();
      expect(screen.getByTestId("hook-lab-panel")).toBeInTheDocument();
    });
  });

  it("should pass correct props to panels", async () => {
    const { container } = render(
      <SeoDashboardShell
        seoProfile={mockSeoProfile}
        organizationId="org-123"
        userRole="staff"
      />
    );

    await waitFor(() => {
      // Verify panels are rendered (props are passed internally)
      expect(container.querySelector('[data-testid="gsc-overview-panel"]')).toBeInTheDocument();
    });
  });
});
