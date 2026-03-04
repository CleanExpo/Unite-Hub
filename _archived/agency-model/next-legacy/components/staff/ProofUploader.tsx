'use client';

import { useState } from 'react';

interface ProofUploaderProps {
  onUpload: (file: File) => void;
}

export default function ProofUploader({ onUpload }: ProofUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Call parent handler
      await onUpload(file);

      // Reset input
      e.target.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="inline-block">
      <label
        className={`
          px-4 py-2 rounded border cursor-pointer
          ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}
          transition-colors
        `}
      >
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
        />
        {uploading ? 'Uploading...' : 'Upload Proof'}
      </label>
    </div>
  );
}
