import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/media/upload
 * Uploads multimedia files to Supabase Storage and creates database record
 *
 * Phase 2B: Multimedia Input System
 *
 * Request: multipart/form-data
 *   - file: File (required)
 *   - workspace_id: string (required)
 *   - org_id: string (required)
 *   - project_id: string (optional)
 *   - tags: string[] (optional)
 *   - file_type: 'video' | 'audio' | 'document' | 'image' | 'sketch' (required)
 *
 * Response: { success: true, media: MediaFile }
 */
export async function POST(req: NextRequest) {
  try {
    // ========================================================================
    // 0. RATE LIMITING
    // ========================================================================
    // 10 uploads per 15 minutes (media uploads are expensive)
    const rateLimitResult = await rateLimit(req, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
      message: 'Too many file uploads, please try again later',
    });

    if (rateLimitResult) {
      return rateLimitResult;
    }

    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      // Implicit OAuth token from browser
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      // Server-side cookies (PKCE flow)
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // ========================================================================
    // 2. PARSE MULTIPART FORM DATA
    // ========================================================================
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const workspace_id = formData.get("workspace_id") as string;
    const org_id = formData.get("org_id") as string;
    const project_id = formData.get("project_id") as string | null;
    const file_type = formData.get("file_type") as string;
    const tagsString = formData.get("tags") as string | null;

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!workspace_id || !org_id || !file_type) {
      return NextResponse.json(
        { error: "Missing required fields: workspace_id, org_id, file_type" },
        { status: 400 }
      );
    }

    const validFileTypes = ["video", "audio", "document", "image", "sketch"];
    if (!validFileTypes.includes(file_type)) {
      return NextResponse.json(
        { error: `Invalid file_type. Must be one of: ${validFileTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // File size validation (100MB)
    const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || "100") * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${process.env.MAX_FILE_SIZE_MB || 100}MB` },
        { status: 400 }
      );
    }

    // Parse tags
    const tags = tagsString ? JSON.parse(tagsString) : [];

    // ========================================================================
    // 2.5. VERIFY WORKSPACE ACCESS (CRITICAL SECURITY CHECK)
    // ========================================================================
    const supabase = await getSupabaseServer();

    // Verify user has permission to upload to this workspace
    const { data: workspaceAccess, error: accessError } = await supabase
      .from('user_organizations')
      .select('role, workspaces!inner(id)')
      .eq('user_id', userId)
      .eq('workspaces.id', workspace_id)
      .single();

    if (accessError || !workspaceAccess) {
      console.error('Workspace access denied:', { userId, workspace_id, error: accessError });
      return NextResponse.json(
        { error: 'Access denied: You do not have permission to upload to this workspace' },
        { status: 403 }
      );
    }

    // ========================================================================
    // 3. FILE EXTENSION VALIDATION
    // ========================================================================
    // Extract and validate file extension
    const fileExtension = file.name.includes('.')
      ? file.name.split('.').pop()?.toLowerCase() || 'bin'
      : 'bin';

    // Define allowed extensions per file type
    const ALLOWED_EXTENSIONS: Record<string, string[]> = {
      video: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'],
      audio: ['mp3', 'wav', 'webm', 'm4a', 'ogg', 'aac', 'flac'],
      document: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'],
      image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      sketch: ['svg', 'json'],
    };

    if (!ALLOWED_EXTENSIONS[file_type]?.includes(fileExtension)) {
      return NextResponse.json(
        {
          error: `Invalid file extension '.${fileExtension}' for type '${file_type}'`,
          allowedExtensions: ALLOWED_EXTENSIONS[file_type]
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // 4. GENERATE STORAGE PATH
    // ========================================================================
    const fileId = crypto.randomUUID();
    const sanitizedFilename = `${fileId}.${fileExtension}`;
    const storagePath = `${workspace_id}/${fileId}/${sanitizedFilename}`;

    // ========================================================================
    // 5. UPLOAD TO SUPABASE STORAGE
    // ========================================================================

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media-uploads")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage", details: uploadError.message },
        { status: 500 }
      );
    }

    // ========================================================================
    // 5. GET PUBLIC URL (signed URL for private bucket)
    // ========================================================================
    const { data: urlData } = supabase.storage
      .from("media-uploads")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // ========================================================================
    // 6. CREATE DATABASE RECORD
    // ========================================================================
    const { data: mediaFile, error: dbError } = await supabase
      .from("media_files")
      .insert({
        id: fileId,
        workspace_id,
        org_id,
        uploaded_by: userId,
        project_id: project_id || null,
        filename: sanitizedFilename,
        original_filename: file.name,
        file_type,
        mime_type: file.type,
        file_size_bytes: file.size,
        storage_path: storagePath,
        storage_bucket: "media-uploads",
        public_url: publicUrl,
        status: "processing", // Will be updated by worker
        progress: 0,
        tags,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete uploaded file
      try {
        await supabase.storage.from("media-uploads").remove([storagePath]);
        console.log('Cleaned up orphaned file after DB error:', storagePath);
      } catch (cleanupError) {
        console.error('Failed to clean up orphaned file:', cleanupError);
      }

      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to create database record", details: dbError.message },
        { status: 500 }
      );
    }

    // ========================================================================
    // 7. AUDIT LOGGING
    // ========================================================================
    const { getSupabaseAdmin } = await import("@/lib/supabase");
    const adminSupabase = getSupabaseAdmin();

    try {
      await adminSupabase.from("auditLogs").insert({
        org_id,
        action: "media_uploaded",
        resource: "media_file",
        resource_id: fileId,
        agent: "media-upload-api",
        status: "success",
        details: {
          user_id: userId,
          file_type,
          file_size: file.size,
          mime_type: file.type,
          workspace_id,
          project_id: project_id || null,
          original_filename: file.name,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditError) {
      // Don't fail upload if audit logging fails, just log the error
      console.error('Failed to create audit log:', auditError);
    }

    // ========================================================================
    // 8. TRIGGER BACKGROUND PROCESSING (PHASE 3 - TODO)
    // ========================================================================
    // Track warnings to inform user
    const warnings: string[] = [];

    // For video/audio: trigger transcription job
    if (file_type === "video" || file_type === "audio") {
      // TODO: Phase 3 - Implement transcription endpoint
      // For now, we'll attempt to call it but not fail if it doesn't exist
      try {
        const transcribeResponse = await fetch(`${req.nextUrl.origin}/api/media/transcribe?workspaceId=${workspace_id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }),
          },
          body: JSON.stringify({ mediaId: fileId }),
        });

        if (!transcribeResponse.ok) {
          if (transcribeResponse.status === 404) {
            warnings.push('Transcription service not yet available (Phase 3 feature)');
          } else {
            warnings.push('Transcription processing may be delayed');
          }
        }
      } catch (err) {
        console.error("Failed to queue transcription:", err);
        warnings.push('Transcription service temporarily unavailable');
      }
    }

    // For all files: trigger AI analysis job
    try {
      const analyzeResponse = await fetch(`${req.nextUrl.origin}/api/media/analyze?workspaceId=${workspace_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` }),
        },
        body: JSON.stringify({ mediaId: fileId }),
      });

      if (!analyzeResponse.ok) {
        if (analyzeResponse.status === 404) {
          warnings.push('AI analysis not yet available (Phase 3 feature)');
        } else {
          warnings.push('AI analysis processing may be delayed');
        }
      }
    } catch (err) {
      console.error("Failed to queue AI analysis:", err);
      warnings.push('AI analysis service temporarily unavailable');
    }

    // ========================================================================
    // 9. RETURN SUCCESS
    // ========================================================================
    return NextResponse.json({
      success: true,
      media: mediaFile,
      warnings: warnings.length > 0 ? warnings : undefined,
      message: `${file_type} file uploaded successfully${warnings.length > 0 ? ' (some background processing may be delayed)' : ''}`,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media/upload?workspace_id={id}
 * Get all media files for a workspace
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication - support both token and cookie auth
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      // Implicit OAuth token from browser
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      // Server-side cookies (PKCE flow)
      const supabase = await getSupabaseServer();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = user.id;
    }

    // Get workspace_id from query params
    const { searchParams } = new URL(req.url);
    const workspace_id = searchParams.get("workspace_id");
    const project_id = searchParams.get("project_id");
    const file_type = searchParams.get("file_type");
    const status = searchParams.get("status");

    if (!workspace_id) {
      return NextResponse.json(
        { error: "workspace_id query parameter required" },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from("media_files")
      .select("*")
      .eq("workspace_id", workspace_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Optional filters
    if (project_id) {
      query = query.eq("project_id", project_id);
    }
    if (file_type) {
      query = query.eq("file_type", file_type);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: mediaFiles, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch media files", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      media_files: mediaFiles,
      count: mediaFiles.length,
    });

  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
