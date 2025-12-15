"use client";

export const narrativeService = {
  async generateExecutiveBrief(
    context: string,
    signalCount: number,
    status: string,
    warnings?: unknown
  ): Promise<string> {
    const warningList = Array.isArray(warnings)
      ? warnings.filter((w): w is string => typeof w === "string")
      : [];

    const base = `Analysis complete for ${context}. ${signalCount} signals reviewed. Status: ${status}.`;
    if (warningList.length === 0) {
return base;
}

    return `${base} Data gaps: ${warningList.length}.`;
  },
};

