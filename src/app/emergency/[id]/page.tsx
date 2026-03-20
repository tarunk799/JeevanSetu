"use client";

import { useState, useEffect } from "react";
import { MedicalProfile } from "@/lib/types";
import HospitalFinder from "@/components/HospitalFinder";

export default function EmergencyPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [profile, setProfile] = useState<MedicalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${id}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.profile || null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-emergency-bg flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-emergency-accent border-t-transparent rounded-full" aria-label="Loading emergency profile" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-emergency-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-400">This emergency profile link may have expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emergency-bg text-emergency-text">
      {/* Emergency header */}
      <header className="bg-red-700 py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-red-200 uppercase tracking-wide font-semibold">
              Emergency Medical Profile
            </p>
            <h1 className="text-2xl font-bold text-white">
              {profile.patientName}
            </h1>
          </div>
          {profile.bloodType && (
            <div className="bg-white text-red-700 px-4 py-2 rounded-lg text-2xl font-bold" aria-label={`Blood type: ${profile.bloodType}`}>
              {profile.bloodType}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* CRITICAL: Allergies first */}
        {profile.allergies.length > 0 && (
          <section aria-labelledby="em-allergies" className="bg-red-900/50 border border-red-700 rounded-xl p-5">
            <h2 id="em-allergies" className="text-lg font-bold text-red-300 uppercase tracking-wide mb-3">
              Allergies
            </h2>
            <div className="space-y-2">
              {profile.allergies.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      a.severity === "severe"
                        ? "bg-red-500"
                        : a.severity === "moderate"
                        ? "bg-yellow-500"
                        : "bg-orange-500"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-lg">
                    <strong>{a.allergen}</strong>
                    <span className="text-red-300 ml-2">({a.severity})</span>
                    {a.reaction && (
                      <span className="text-gray-400 ml-2">— {a.reaction}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Current Medications */}
        {profile.medications.length > 0 && (
          <section aria-labelledby="em-meds" className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <h2 id="em-meds" className="text-lg font-bold text-emergency-accent uppercase tracking-wide mb-3">
              Current Medications
            </h2>
            <div className="space-y-3">
              {profile.medications.map((med, i) => (
                <div key={i} className="border-b border-gray-700 pb-3 last:border-0 last:pb-0">
                  <p className="text-lg font-semibold">{med.name}</p>
                  <p className="text-gray-400">
                    {[med.dosage, med.frequency].filter(Boolean).join(" • ")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Conditions */}
        {profile.conditions.length > 0 && (
          <section aria-labelledby="em-conditions" className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <h2 id="em-conditions" className="text-lg font-bold text-blue-400 uppercase tracking-wide mb-3">
              Medical Conditions
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.conditions.map((c, i) => (
                <span
                  key={i}
                  className="bg-blue-900/50 text-blue-200 px-3 py-2 rounded-lg text-lg border border-blue-800"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Critical Lab Results */}
        {profile.labResults.length > 0 && (
          <section aria-labelledby="em-labs" className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <h2 id="em-labs" className="text-lg font-bold text-gray-300 uppercase tracking-wide mb-3">
              Recent Lab Results
            </h2>
            <div className="space-y-2">
              {profile.labResults.map((lab, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    lab.status === "critical"
                      ? "bg-red-900/30 border border-red-800"
                      : lab.status === "warning"
                      ? "bg-yellow-900/30 border border-yellow-800"
                      : "bg-gray-700/30"
                  }`}
                >
                  <span className="font-medium">{lab.testName}</span>
                  <span className="text-lg font-bold">
                    {lab.value} <span className="text-sm text-gray-400">{lab.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Emergency Contacts */}
        {profile.emergencyContacts.length > 0 && (
          <section aria-labelledby="em-contacts" className="bg-green-900/30 border border-green-800 rounded-xl p-5">
            <h2 id="em-contacts" className="text-lg font-bold text-green-400 uppercase tracking-wide mb-3">
              Emergency Contacts
            </h2>
            <div className="space-y-3">
              {profile.emergencyContacts.map((contact, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{contact.name}</p>
                    <p className="text-gray-400">{contact.relation}</p>
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Call {contact.phone}
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nearby Hospitals */}
        <HospitalFinder />

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm pt-4">
          <p>JeevanSetu Emergency Profile</p>
          <p>Last updated: {new Date(profile.updatedAt).toLocaleString()}</p>
        </footer>
      </div>
    </div>
  );
}
