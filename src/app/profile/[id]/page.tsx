"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MedicalProfile } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [profile, setProfile] = useState<MedicalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/${id}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.profile || null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4" aria-label="Loading profile">
          <div className="h-10 bg-gray-200 rounded w-64" />
          <div className="h-48 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <Link href="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const emergencyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/emergency/${profile.shareToken}`
    : "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{profile.patientName}</h1>
          <p className="text-gray-500 mt-1">
            Created {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile.bloodType && (
            <span className="bg-red-100 text-red-800 px-3 py-2 rounded-lg text-lg font-bold">
              {profile.bloodType}
            </span>
          )}
          <button onClick={() => setShowQR(!showQR)} className="btn-secondary">
            {showQR ? "Hide QR" : "Share QR"}
          </button>
          <Link
            href={`/emergency/${profile.shareToken}`}
            className="btn-primary"
            target="_blank"
          >
            Emergency View
          </Link>
        </div>
      </div>

      {/* QR Code */}
      {showQR && (
        <div className="card mb-6 text-center">
          <h2 className="text-lg font-semibold mb-4">Emergency QR Code</h2>
          <div className="inline-block p-4 bg-white rounded-xl border">
            <QRCodeSVG value={emergencyUrl} size={200} level="H" />
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Scan this QR code to access the emergency medical profile.
          </p>
          <p className="text-xs text-gray-400 mt-1 break-all">{emergencyUrl}</p>
        </div>
      )}

      {/* Medications */}
      {profile.medications.length > 0 && (
        <section className="card mb-4" aria-labelledby="meds-heading">
          <h2 id="meds-heading" className="text-xl font-semibold mb-4">
            Medications ({profile.medications.length})
          </h2>
          <div className="space-y-3">
            {profile.medications.map((med, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{med.name}</p>
                <p className="text-sm text-gray-600">
                  {[med.dosage, med.frequency, med.duration].filter(Boolean).join(" • ")}
                </p>
                {med.prescribedFor && (
                  <p className="text-sm text-gray-500">For: {med.prescribedFor}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Allergies */}
      {profile.allergies.length > 0 && (
        <section className="card mb-4" aria-labelledby="allergy-heading">
          <h2 id="allergy-heading" className="text-xl font-semibold mb-4">
            Allergies ({profile.allergies.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.allergies.map((a, i) => (
              <span
                key={i}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  a.severity === "severe"
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : a.severity === "moderate"
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    : "bg-orange-100 text-orange-800 border border-orange-200"
                }`}
              >
                {a.allergen} — {a.severity}
                {a.reaction ? ` (${a.reaction})` : ""}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Conditions */}
      {profile.conditions.length > 0 && (
        <section className="card mb-4" aria-labelledby="conditions-heading">
          <h2 id="conditions-heading" className="text-xl font-semibold mb-4">
            Conditions ({profile.conditions.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.conditions.map((c, i) => (
              <span
                key={i}
                className={`px-3 py-2 rounded-lg text-sm ${
                  c.status === "active"
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                {c.name} ({c.status})
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Lab Results */}
      {profile.labResults.length > 0 && (
        <section className="card mb-4" aria-labelledby="lab-heading">
          <h2 id="lab-heading" className="text-xl font-semibold mb-4">
            Lab Results ({profile.labResults.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Lab test results showing values, reference ranges, and status</caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className="text-left py-2 pr-4">Test</th>
                  <th scope="col" className="text-left py-2 pr-4">Value</th>
                  <th scope="col" className="text-left py-2 pr-4">Reference</th>
                  <th scope="col" className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {profile.labResults.map((lab, i) => (
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
        </section>
      )}

      {/* Add more data */}
      <div className="mt-6 text-center">
        <Link href="/upload" className="btn-secondary">
          + Upload More Records
        </Link>
      </div>
    </div>
  );
}
