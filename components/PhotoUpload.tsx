"use client";

import { useState, useRef } from "react";
import { Upload, Camera, Loader2, CheckCircle, XCircle } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface PhotoUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError: (error: string) => void;
}

export default function PhotoUpload({
  onUploadComplete,
  onUploadError,
}: PhotoUploadProps) {
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onUploadError("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onUploadError("Image must be under 10MB.");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setStatus("uploading");
    setProgress(30);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 200);

    const { data, error } = await uploadToCloudinary(file);

    clearInterval(progressInterval);

    if (error || !data) {
      setStatus("error");
      setProgress(0);
      onUploadError(error || "Upload failed");
      return;
    }

    setStatus("success");
    setProgress(100);
    onUploadComplete(data.secure_url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        style={{ display: "none" }}
        id="photo-upload-input"
      />

      {!preview ? (
        <div
          className={`upload-zone ${status === "uploading" ? "active" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              fileInputRef.current?.click();
            }
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "var(--radius-lg)",
                background: "var(--accent-blue-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera size={28} color="var(--accent-blue)" />
            </div>
            <div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: "1rem",
                  marginBottom: 4,
                  color: "var(--text-primary)",
                }}
              >
                Tap to add a photo
              </p>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                }}
              >
                or drag and drop • Max 10MB
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 4,
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                style={{
                  padding: "8px 16px",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload size={14} />
                Upload File
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--border-default)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview of uploaded item"
            style={{
              width: "100%",
              maxHeight: 300,
              objectFit: "cover",
              display: "block",
            }}
          />

          {/* Upload status overlay */}
          {status === "uploading" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <Loader2
                size={32}
                color="var(--accent-blue)"
                className="animate-spin"
              />
              <p style={{ fontWeight: 500 }}>Uploading photo...</p>
              <div
                style={{
                  width: "60%",
                  height: 4,
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-full)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "var(--accent-blue)",
                    borderRadius: "var(--radius-full)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          )}

          {status === "success" && (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "rgba(16, 185, 129, 0.9)",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              <CheckCircle size={14} />
              Uploaded
            </div>
          )}

          {status === "error" && (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "rgba(239, 68, 68, 0.9)",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              <XCircle size={14} />
              Failed
            </div>
          )}

          {/* Reset button */}
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setStatus("idle");
              setProgress(0);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              background: "rgba(0, 0, 0, 0.7)",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 500,
            }}
          >
            Change Photo
          </button>
        </div>
      )}
    </div>
  );
}
