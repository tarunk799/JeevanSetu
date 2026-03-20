"use client";

import { AnalysisResponse } from "@/lib/types";

/**
 * Props for the AnalysisResult component.
 */
export interface AnalysisResultProps {
  /** The structured analysis response returned by the Gemini AI API. */
  result: AnalysisResponse;
  /** Callback fired when the user clicks the "Save to Medical Profile" button. */
  onSave: () => void;
  /** Whether a save operation is currently in progress. */
  saving: boolean;
}

/**
 * AnalysisResult renders the full analysis output including confidence score,
 * warnings, medications, lab results, conditions, allergies, and a save button.
 */
export default function AnalysisResult({
  result,
  onSave,
  saving,
}: AnalysisResultProps) {
  return (
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
              <caption className="sr-only">Lab test results with values and status indicators</caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className="text-left py-2 pr-4">Test</th>
                  <th scope="col" className="text-left py-2 pr-4">Value</th>
                  <th scope="col" className="text-left py-2 pr-4">Reference</th>
                  <th scope="col" className="text-left py-2">Status</th>
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
        onClick={onSave}
        disabled={saving}
        className="btn-primary w-full mt-4"
        aria-busy={saving}
      >
        {saving ? "Saving..." : "Save to Medical Profile"}
      </button>
    </div>
  );
}
