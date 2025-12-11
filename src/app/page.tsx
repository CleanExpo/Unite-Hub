"use client";

import LandingPage from "./landing/page";

// Root home route
// NOTE: `/landing` contains the new Unite-Hub marketing experience
// ("Get 90 Days of Real Marketing Momentum" etc). The old Synthex
// landing implementation has been intentionally replaced so that both
// localhost and production show the new home at `/`.

export default function Home() {
  return <LandingPage />;
}
