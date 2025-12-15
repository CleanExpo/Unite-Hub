import { errorResponse } from "@/lib/api-helpers";

export function withErrorBoundary<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => Promise<TResult> | TResult
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      return errorResponse(message, 500) as unknown as TResult;
    }
  };
}

