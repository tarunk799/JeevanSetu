"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnalysisResponse } from "@/lib/types";
import ImageUploader from "@/components/upload/ImageUploader";
import AnalysisResult from "@/components/upload/AnalysisResult";

type InputMode = "image" | "text";
type ImageType = "prescription" | "lab_report" | "medicine_photo";

export default function UploadPage() {
  const router = useRouter();

  const [mode, setMode] = useState<InputMode>("image");
  const [imageType, setImageType] = useState<ImageType>("prescription");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleImageTypeChange = useCallback((type: ImageType) => {
    setImageType(type);
  }, []);

  const handleImageSelect = useCallback((base64: string) => {
    setImagePreview(base64);
    setError(null);
    setResult(null);
  }, []);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body =
        mode === "image"
          ? { type: imageType, image: imagePreview }
          : { type: "free_text" as const, text: textInput };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [mode, imageType, imagePreview, textInput]);

  const saveToProfile = useCallback(async () => {
    if (!result?.data) return;

    setSaving(true);
    try {
      const profileData = {
        patientName: result.data.patientInfo?.name || "My Profile",
        bloodType: result.data.patientInfo?.bloodType,
        medications: result.data.medications || [],
        allergies: result.data.allergies || [],
        conditions: result.data.conditions || [],
        labResults: result.data.labResults || [],
        emergencyContacts: [],
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      router.push(`/profile/${data.profile.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }, [result, router]);

  const canAnalyze =
    mode === "image" ? !!imagePreview : textInput.trim().length > 10;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Upload Medical Records</h1>
      <p className="text-gray-600 mb-8">
        Upload a prescription, lab report, or describe your medical history.
        Gemini AI will extract structured information.
      </p>

      {/* Mode selector */}
      <div className="flex gap-2 mb-6" role="tablist" aria-label="Input mode">
        <button
          role="tab"
          aria-selected={mode === "image"}
          onClick={() => { setMode("image"); setResult(null); setError(null); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === "image"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Image Upload
        </button>
        <button
          role="tab"
          aria-selected={mode === "text"}
          onClick={() => { setMode("text"); setResult(null); setError(null); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === "text"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Text Input
        </button>
      </div>

      {/* Image upload */}
      {mode === "image" && (
        <ImageUploader
          imageType={imageType}
          onImageTypeChange={handleImageTypeChange}
          imagePreview={imagePreview}
          onImageSelect={handleImageSelect}
        />
      )}

      {/* Text input */}
      {mode === "text" && (
        <div>
          <label htmlFor="medical-text" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your medical history
          </label>
          <textarea
            id="medical-text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Example: I have Type 2 diabetes, diagnosed in 2019. Currently taking Metformin 500mg twice daily. Allergic to penicillin — causes rash. Had appendectomy in 2015. Blood type is B+."
            aria-invalid={mode === "text" && textInput.length > 0 && textInput.length < 10 ? "true" : undefined}
            aria-describedby="text-help"
            className="w-full h-40 p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p id="text-help" className="text-sm text-gray-500 mt-1">
            {textInput.length} characters {textInput.length > 0 && textInput.length < 10 ? "(minimum 10 required)" : ""}
          </p>
        </div>
      )}

      {/* Error — live region for screen readers */}
      <div aria-live="assertive" aria-atomic="true">
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700" role="alert">
            {error}
          </div>
        )}
      </div>

      {/* Analyze button */}
      <button
        onClick={analyze}
        disabled={!canAnalyze || loading}
        className="btn-primary mt-6 w-full"
        aria-busy={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" aria-hidden="true" />
            Analyzing with Gemini AI...
          </span>
        ) : (
          "Analyze with Gemini AI"
        )}
      </button>

      {/* Results */}
      {result && (
        <AnalysisResult
          result={result}
          onSave={saveToProfile}
          saving={saving}
        />
      )}
    </div>
  );
}
