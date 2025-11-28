/**
 * Unit Tests: SeoModeToggle Component
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SeoModeToggle from "../SeoModeToggle";

describe("SeoModeToggle", () => {
  it("should render both mode buttons", () => {
    const onModeChange = vi.fn();
    render(<SeoModeToggle mode="standard" onModeChange={onModeChange} />);

    expect(screen.getByText("Standard")).toBeInTheDocument();
    expect(screen.getByText("Hypnotic")).toBeInTheDocument();
  });

  it("should highlight standard mode when active", () => {
    const onModeChange = vi.fn();
    render(<SeoModeToggle mode="standard" onModeChange={onModeChange} />);

    const standardButton = screen.getByText("Standard").closest("button");
    expect(standardButton).toHaveAttribute("aria-pressed", "true");
    // Active state uses text-white class instead of bg-primary (gradient is on sliding background)
    expect(standardButton).toHaveClass("text-white");
  });

  it("should highlight hypnotic mode when active", () => {
    const onModeChange = vi.fn();
    render(<SeoModeToggle mode="hypnotic" onModeChange={onModeChange} />);

    const hypnoticButton = screen.getByText("Hypnotic").closest("button");
    expect(hypnoticButton).toHaveAttribute("aria-pressed", "true");
    // Active state uses text-white class instead of bg-primary (gradient is on sliding background)
    expect(hypnoticButton).toHaveClass("text-white");
  });

  it("should call onModeChange when clicking standard button", () => {
    const onModeChange = vi.fn();
    render(<SeoModeToggle mode="hypnotic" onModeChange={onModeChange} />);

    const standardButton = screen.getByText("Standard");
    fireEvent.click(standardButton);

    expect(onModeChange).toHaveBeenCalledWith("standard");
  });

  it("should call onModeChange when clicking hypnotic button", () => {
    const onModeChange = vi.fn();
    render(<SeoModeToggle mode="standard" onModeChange={onModeChange} />);

    const hypnoticButton = screen.getByText("Hypnotic");
    fireEvent.click(hypnoticButton);

    expect(onModeChange).toHaveBeenCalledWith("hypnotic");
  });

  it("should have proper accessibility attributes", () => {
    const onModeChange = vi.fn();
    render(<SeoModeToggle mode="standard" onModeChange={onModeChange} />);

    const standardButton = screen.getByLabelText("Switch to Standard Mode");
    const hypnoticButton = screen.getByLabelText("Switch to Hypnotic Velocity Mode");

    expect(standardButton).toBeInTheDocument();
    expect(hypnoticButton).toBeInTheDocument();
  });

  it("should render icon components", () => {
    const onModeChange = vi.fn();
    const { container } = render(<SeoModeToggle mode="standard" onModeChange={onModeChange} />);

    // Check that lucide-react icons are rendered
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(2); // At least 2 icons (one per button)
  });
});
