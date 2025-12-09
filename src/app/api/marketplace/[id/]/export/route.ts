import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRateLimit } from "@/lib/rate-limit";

interface ExportRequest {
  format: "tsx" | "jsx" | "css" | "json";
  includeImports?: boolean;
  includeTailwind?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    const componentId = params.id;
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const body: ExportRequest = await request.json();
    const { format, includeImports = true, includeTailwind = true } = body;

    if (!["tsx", "jsx", "css", "json"].includes(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: component, error } = await supabase
      .from("marketplace_components")
      .select("id, name, component_code, tailwind_classes, export_count")
      .eq("id", componentId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error || !component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    let exportCode = "";
    let fileName = `${component.name.toLowerCase().replace(/\s+/g, "-")}`;

    if (format === "tsx" || format === "jsx") {
      let imports = "";
      if (includeImports) {
        imports = `import React from "react";\n`;
        if (includeTailwind) {
          imports += `import { cn } from "@/lib/utils";\n`;
        }
        imports += `\n`;
      }
      exportCode = `${imports}${component.component_code}`;
      fileName += `.${format}`;
    } else if (format === "css") {
      exportCode = `/* ${component.name} - Tailwind Classes */\n`;
      if (includeTailwind) {
        exportCode += `@apply ${component.tailwind_classes};\n`;
      }
      fileName += ".css";
    } else if (format === "json") {
      const jsonExport = {
        name: component.name,
        component_code: component.component_code,
        tailwind_classes: component.tailwind_classes,
        exports: { [format]: exportCode },
      };
      exportCode = JSON.stringify(jsonExport, null, 2);
      fileName += ".json";
    }

    await supabase
      .from("marketplace_components")
      .update({ export_count: (component.export_count || 0) + 1 })
      .eq("id", componentId);

    return NextResponse.json({
      success: true,
      data: { code: exportCode, fileName, format },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
