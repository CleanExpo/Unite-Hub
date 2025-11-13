import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Update calendar post
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const body = await req.json();
    const { postId } = await params;

    const result = await convex.mutation(api.contentCalendar.updatePost, {
      postId: postId as Id<"contentCalendarPosts">,
      ...body,
    });

    return NextResponse.json({ success: true, postId: result });
  } catch (error: any) {
    console.error("Error updating calendar post:", error);
    return NextResponse.json(
      { error: "Failed to update post", details: error.message },
      { status: 500 }
    );
  }
}

// Delete calendar post
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    await convex.mutation(api.contentCalendar.deletePost, {
      postId: postId as Id<"contentCalendarPosts">,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting calendar post:", error);
    return NextResponse.json(
      { error: "Failed to delete post", details: error.message },
      { status: 500 }
    );
  }
}
