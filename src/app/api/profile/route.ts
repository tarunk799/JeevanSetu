import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { MedicalProfile } from "@/lib/types";
import { getAllProfiles, saveProfile } from "@/lib/store";

export async function GET() {
  const profiles = getAllProfiles();
  return NextResponse.json({ profiles });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const profile: MedicalProfile = {
      id: uuidv4(),
      patientName: body.patientName || "Unknown Patient",
      dateOfBirth: body.dateOfBirth,
      bloodType: body.bloodType,
      emergencyContacts: body.emergencyContacts || [],
      medications: body.medications || [],
      allergies: body.allergies || [],
      conditions: body.conditions || [],
      labResults: body.labResults || [],
      shareToken: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProfile(profile);

    return NextResponse.json({ success: true, profile }, { status: 201 });
  } catch (error) {
    console.error("Profile creation error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { success: false, error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
