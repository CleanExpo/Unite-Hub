"use client";

import React from "react";
import { AssetUpload } from "@/components/assets/AssetUpload";
import { AssetGallery } from "@/components/assets/AssetGallery";
import { Upload, FileText } from "lucide-react";

export default function AssetsPage() {
  // TODO: Replace with actual Convex data
  const mockAssets = [
    {
      _id: "1",
      fileName: "company-logo.png",
      fileUrl: "https://via.placeholder.com/400x400",
      fileType: "logo",
      mimeType: "image/png",
      fileSize: 102400,
      uploadedAt: Date.now() - 86400000,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
        <p className="text-gray-600 mt-1">
          Upload and manage your brand assets, logos, and marketing materials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AssetUpload
            onUploadComplete={(assetId) => {
              console.log("Asset uploaded:", assetId);
            }}
          />
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your Assets</h2>
                <p className="text-sm text-gray-600">{mockAssets.length} files uploaded</p>
              </div>
            </div>

            <AssetGallery
              assets={mockAssets}
              onDelete={(assetId) => console.log("Delete:", assetId)}
              onDownload={(assetId) => console.log("Download:", assetId)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
