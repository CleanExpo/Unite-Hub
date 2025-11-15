import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 2MB" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed",
        },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `avatar.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Delete old avatar if exists
    const { data: oldFiles } = await supabase.storage
      .from("avatars")
      .list(userId);

    if (oldFiles && oldFiles.length > 0) {
      const filesToDelete = oldFiles.map((file) => `${userId}/${file.name}`);
      await supabase.storage.from("avatars").remove(filesToDelete);
    }

    // Convert File to ArrayBuffer then to Uint8Array for upload
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload new avatar
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload avatar", details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        {
          error: "Failed to update profile with avatar URL",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase.from("auditLogs").insert({
      user_id: userId,
      action: "avatar_updated",
      entity_type: "user_profile",
      entity_id: userId,
      metadata: {
        file_name: fileName,
        file_size: file.size,
        file_type: file.type,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
      message: "Avatar uploaded successfully",
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove avatar
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all files in user's avatar folder
    const { data: files } = await supabase.storage.from("avatars").list(userId);

    if (files && files.length > 0) {
      const filesToDelete = files.map((file) => `${userId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove(filesToDelete);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete avatar", details: deleteError.message },
          { status: 500 }
        );
      }
    }

    // Update user profile to remove avatar URL
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ avatar_url: null })
      .eq("id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        {
          error: "Failed to update profile",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase.from("auditLogs").insert({
      user_id: userId,
      action: "avatar_deleted",
      entity_type: "user_profile",
      entity_id: userId,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Avatar deleted successfully",
    });
  } catch (error) {
    console.error("Avatar deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
