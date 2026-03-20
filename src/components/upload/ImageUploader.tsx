"use client";

import { useRef, useCallback } from "react";

type ImageType = "prescription" | "lab_report" | "medicine_photo";

/**
 * Props for the ImageUploader component.
 */
export interface ImageUploaderProps {
  /** The currently selected image type (prescription, lab_report, or medicine_photo). */
  imageType: string;
  /** Callback fired when the user selects a different image type. */
  onImageTypeChange: (type: ImageType) => void;
  /** Base64 data-URL preview of the selected image, or null if none selected. */
  imagePreview: string | null;
  /** Callback fired with the base64 data-URL when the user selects or drops an image. */
  onImageSelect: (base64: string) => void;
}

/**
 * ImageUploader provides image-type radio buttons and a drag-and-drop zone
 * for uploading medical document images (prescriptions, lab reports, medicine photos).
 */
export default function ImageUploader({
  imageType,
  onImageTypeChange,
  imagePreview,
  onImageSelect,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        onImageSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          onImageSelect(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageSelect]
  );

  return (
    <div>
      <div className="flex gap-3 mb-4">
        {(
          [
            ["prescription", "Prescription"],
            ["lab_report", "Lab Report"],
            ["medicine_photo", "Medicine Photo"],
          ] as const
        ).map(([val, label]) => (
          <label
            key={val}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${
              imageType === val
                ? "border-primary bg-blue-50 text-primary"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="imageType"
              value={val}
              checked={imageType === val}
              onChange={() => onImageTypeChange(val)}
              className="sr-only"
            />
            <span className="text-sm font-medium">{label}</span>
          </label>
        ))}
      </div>

      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        aria-label="Upload image file"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
      >
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Uploaded document preview"
            className="max-h-64 mx-auto rounded-lg"
          />
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop an image here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              JPEG, PNG up to 10MB
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Select image file"
        />
      </div>
    </div>
  );
}
