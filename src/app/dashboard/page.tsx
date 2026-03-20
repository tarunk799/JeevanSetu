"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MedicalProfile } from "@/lib/types";

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<MedicalProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => setProfiles(data.profiles || []))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Medical Profiles</h1>
        <Link href="/upload" className="btn-primary">
          + New Upload
        </Link>
      </div>

      {profiles.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-xl text-gray-500 mb-4">No profiles yet</p>
          <p className="text-gray-400 mb-6">
            Upload a prescription or lab report to create your first medical
            profile.
          </p>
          <Link href="/upload" className="btn-primary">
            Upload Medical Records
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/profile/${profile.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{profile.patientName}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {profile.medications.length} medication(s) •{" "}
                    {profile.conditions.length} condition(s) •{" "}
                    {profile.allergies.length} allergy(ies) •{" "}
                    {profile.labResults.length} lab result(s)
                  </p>
                </div>
                <div className="text-right">
                  {profile.bloodType && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                      {profile.bloodType}
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(profile.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
