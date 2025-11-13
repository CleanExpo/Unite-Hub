import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Approve calendar post
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;

    const result = await convex.mutation(api.contentCalendar.approvePost, {
      postId: postId as Id<"contentCalendarPosts">,
    });

    return NextResponse.json({ success: true, postId: result });
  } catch (error: any) {
    console.error("Error approving calendar post:", error);
    return NextResponse.json(
      { error: "Failed to approve post", details: error.message },
      { status: 500 }
    );
  }
}
