import { NextRequest, NextResponse } from "next/server";
import { getProfile, getProfileByShareToken, saveProfile, deleteProfile } from "@/lib/store";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = params;

  // Try by profile ID first, then by shareToken (for emergency view)
  let profile = getProfile(id);
  if (!profile) {
    profile = getProfileByShareToken(id);
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = params;
  const existing = getProfile(id);

  if (!existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  try {
    const body = await request.json();

    const updated = {
      ...existing,
      ...body,
      id: existing.id,
      shareToken: existing.shareToken,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    // Merge arrays instead of replacing
    if (body.medications) {
      updated.medications = [...existing.medications, ...body.medications];
    }
    if (body.allergies) {
      updated.allergies = [...existing.allergies, ...body.allergies];
    }
    if (body.conditions) {
      updated.conditions = [...existing.conditions, ...body.conditions];
    }
    if (body.labResults) {
      updated.labResults = [...existing.labResults, ...body.labResults];
    }

    saveProfile(updated);
    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("Profile update error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = params;

  if (!deleteProfile(id)) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
