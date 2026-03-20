"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnalysisResponse } from "@/lib/types";

type InputMode = "image" | "text";
type ImageType = "prescription" | "lab_report" | "medicine_photo";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<InputMode>("image");
  const [imageType, setImageType] = useState<ImageType>("prescription");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPEG, PNG, etc.)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be under 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setError(null);
        setResult(null);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result as string);
          setError(null);
          setResult(null);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const analyze = async () => {
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
  };

  const saveToProfile = async () => {
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
  };

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
                  onChange={() => setImageType(val)}
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
            className="w-full h-40 p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            {textInput.length} characters
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700" role="alert">
          {error}
        </div>
      )}

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
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Analysis Results</h2>
            <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
              Confidence: {Math.round(result.confidence * 100)}%
            </span>
          </div>

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg" role="alert">
              <h3 className="font-semibold text-yellow-800 mb-2">Warnings</h3>
              <ul className="list-disc list-inside text-yellow-700 text-sm">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Medications */}
          {result.data.medications && result.data.medications.length > 0 && (
            <div className="card mb-4">
              <h3 className="font-semibold text-lg mb-3">Medications</h3>
              <div className="space-y-3">
                {result.data.medications.map((med, i) => (
                  <div key={i} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-gray-600">
                        {[med.dosage, med.frequency, med.duration]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                      {med.prescribedFor && (
                        <p className="text-sm text-gray-500">For: {med.prescribedFor}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {Math.round(med.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Results */}
          {result.data.labResults && result.data.labResults.length > 0 && (
            <div className="card mb-4">
              <h3 className="font-semibold text-lg mb-3">Lab Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Test</th>
                      <th className="text-left py-2 pr-4">Value</th>
                      <th className="text-left py-2 pr-4">Reference</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.labResults.map((lab, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{lab.testName}</td>
                        <td className="py-2 pr-4">
                          {lab.value} {lab.unit}
                        </td>
                        <td className="py-2 pr-4 text-gray-500">{lab.referenceRange}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              lab.status === "critical"
                                ? "bg-red-100 text-red-800"
                                : lab.status === "warning"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {lab.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Conditions */}
          {result.data.conditions && result.data.conditions.length > 0 && (
            <div className="card mb-4">
              <h3 className="font-semibold text-lg mb-3">Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {result.data.conditions.map((c, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded-full text-sm ${
                      c.status === "active"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergies */}
          {result.data.allergies && result.data.allergies.length > 0 && (
            <div className="card mb-4">
              <h3 className="font-semibold text-lg mb-3">Allergies</h3>
              <div className="flex flex-wrap gap-2">
                {result.data.allergies.map((a, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      a.severity === "severe"
                        ? "bg-red-100 text-red-800"
                        : a.severity === "moderate"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {a.allergen} ({a.severity})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={saveToProfile}
            disabled={saving}
            className="btn-primary w-full mt-4"
            aria-busy={saving}
          >
            {saving ? "Saving..." : "Save to Medical Profile"}
          </button>
        </div>
      )}
    </div>
  );
}
