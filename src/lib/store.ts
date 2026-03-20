import { MedicalProfile } from "./types";

// In-memory store for V0.1 — replace with Firestore in V0.2
const profiles = new Map<string, MedicalProfile>();

// Also index by shareToken for emergency view lookup
const shareTokenIndex = new Map<string, string>();

export function getProfile(id: string): MedicalProfile | undefined {
  return profiles.get(id);
}

export function getProfileByShareToken(token: string): MedicalProfile | undefined {
  const id = shareTokenIndex.get(token);
  if (!id) return undefined;
  return profiles.get(id);
}

export function getAllProfiles(): MedicalProfile[] {
  return Array.from(profiles.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function saveProfile(profile: MedicalProfile): void {
  profiles.set(profile.id, profile);
  shareTokenIndex.set(profile.shareToken, profile.id);
}

export function deleteProfile(id: string): boolean {
  const profile = profiles.get(id);
  if (!profile) return false;
  shareTokenIndex.delete(profile.shareToken);
  profiles.delete(id);
  return true;
}
