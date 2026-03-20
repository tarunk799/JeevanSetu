import { NextRequest, NextResponse } from "next/server";
import { getProfile, getProfileByShareToken, saveProfile, deleteProfile } from "@/lib/store";
import { optionalAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = params;

  // Try by profile ID first, then by shareToken (for emergency view)
  let profile = await getProfile(id);
  if (!profile) {
    profile = await getProfileByShareToken(id);
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = params;
  const existing = await getProfile(id);

  if (!existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Optional auth — ownership check when both sides have a userId
  const auth = await optionalAuth(request);
  if (!auth.authenticated) {
    logger.warn("Unauthenticated profile update request — allowing for MVP demo", {
      profileId: id,
    });
  } else if (existing.userId && auth.uid !== existing.userId) {
    return NextResponse.json(
      { success: false, error: "Forbidden: you do not own this profile" },
      { status: 403 }
    );
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

    await saveProfile(updated);
    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    logger.error("Profile update error", {
      profileId: id,
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = params;

  const existing = await getProfile(id);
  if (!existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Optional auth — ownership check when both sides have a userId
  const auth = await optionalAuth(request);
  if (!auth.authenticated) {
    logger.warn("Unauthenticated profile delete request — allowing for MVP demo", {
      profileId: id,
    });
  } else if (existing.userId && auth.uid !== existing.userId) {
    return NextResponse.json(
      { success: false, error: "Forbidden: you do not own this profile" },
      { status: 403 }
    );
  }

  if (!(await deleteProfile(id))) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
