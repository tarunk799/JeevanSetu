import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { MedicalProfile } from "@/lib/types";
import { getAllProfiles, saveProfile } from "@/lib/store";
import { createProfileSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
  const profiles = await getAllProfiles();
  return NextResponse.json(
    { profiles },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (MVP: warn but don't block if unauthenticated)
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      logger.warn("Unauthenticated profile creation request — allowing for MVP demo");
    }

    const rawBody = await request.json();

    // Validate with Zod
    const parseResult = createProfileSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((i) => i.message);
      return NextResponse.json(
        { success: false, error: "Invalid profile data", details: errors },
        { status: 400 }
      );
    }

    const body = parseResult.data;

    const profile: MedicalProfile = {
      id: uuidv4(),
      patientName: body.patientName,
      dateOfBirth: body.dateOfBirth,
      bloodType: body.bloodType,
      emergencyContacts: body.emergencyContacts,
      medications: body.medications,
      allergies: body.allergies,
      conditions: body.conditions,
      labResults: body.labResults,
      shareToken: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Attach userId when the caller is authenticated
    if (auth.authenticated && auth.uid) {
      profile.userId = auth.uid;
    }

    await saveProfile(profile);
    logger.info("Profile created", {
      profileId: profile.id,
      authenticated: auth.authenticated,
    });

    return NextResponse.json({ success: true, profile }, { status: 201 });
  } catch (error) {
    logger.error("Profile creation failed", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json(
      { success: false, error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
