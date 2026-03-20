import { Firestore } from "@google-cloud/firestore";
import { MedicalProfile } from "./types";

// ---------------------------------------------------------------------------
// Firestore initialisation (with graceful fallback to in-memory for local dev)
// ---------------------------------------------------------------------------

let db: Firestore | null = null;
let firestoreAvailable = false;

try {
  db = new Firestore({
    projectId: process.env.GCP_PROJECT_ID || undefined,
    ignoreUndefinedProperties: true,
  });
  firestoreAvailable = true;
} catch (err) {
  console.warn(
    "[store] Firestore initialisation failed – falling back to in-memory store.",
    err instanceof Error ? err.message : err
  );
}

const COLLECTION = "profiles";

// ---------------------------------------------------------------------------
// In-memory fallback store (also used as a thin 30-second cache)
// ---------------------------------------------------------------------------

interface CacheEntry {
  profile: MedicalProfile;
  cachedAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

const cache = new Map<string, CacheEntry>();
const shareTokenCache = new Map<string, CacheEntry>(); // shareToken → CacheEntry

// Fallback-only stores (used when Firestore is unavailable)
const fallbackProfiles = new Map<string, MedicalProfile>();
const fallbackShareTokenIndex = new Map<string, string>();

function isCacheValid(entry: CacheEntry | undefined): entry is CacheEntry {
  if (!entry) return false;
  return Date.now() - entry.cachedAt < CACHE_TTL_MS;
}

function cacheProfile(profile: MedicalProfile): void {
  const entry: CacheEntry = { profile, cachedAt: Date.now() };
  cache.set(profile.id, entry);
  shareTokenCache.set(profile.shareToken, entry);
}

function invalidateCache(id: string, shareToken?: string): void {
  cache.delete(id);
  if (shareToken) {
    shareTokenCache.delete(shareToken);
  }
}

// ---------------------------------------------------------------------------
// Firestore helpers
// ---------------------------------------------------------------------------

function profileToFirestore(
  profile: MedicalProfile
): FirebaseFirestore.DocumentData {
  // Firestore doesn't need special conversion here – the profile is plain JSON
  return { ...profile };
}

function firestoreToProfile(
  data: FirebaseFirestore.DocumentData
): MedicalProfile {
  return data as MedicalProfile;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getProfile(
  id: string
): Promise<MedicalProfile | undefined> {
  // 1. Check cache
  const cached = cache.get(id);
  if (isCacheValid(cached)) return cached.profile;

  // 2. Firestore
  if (firestoreAvailable && db) {
    try {
      const doc = await db.collection(COLLECTION).doc(id).get();
      if (!doc.exists) return undefined;
      const profile = firestoreToProfile(doc.data()!);
      cacheProfile(profile);
      return profile;
    } catch (err) {
      console.error("[store] Firestore getProfile error:", err);
    }
  }

  // 3. Fallback
  return fallbackProfiles.get(id);
}

export async function getProfileByShareToken(
  token: string
): Promise<MedicalProfile | undefined> {
  // 1. Check cache
  const cached = shareTokenCache.get(token);
  if (isCacheValid(cached)) return cached.profile;

  // 2. Firestore query
  if (firestoreAvailable && db) {
    try {
      const snapshot = await db
        .collection(COLLECTION)
        .where("shareToken", "==", token)
        .limit(1)
        .get();

      if (snapshot.empty) return undefined;
      const profile = firestoreToProfile(snapshot.docs[0].data());
      cacheProfile(profile);
      return profile;
    } catch (err) {
      console.error("[store] Firestore getProfileByShareToken error:", err);
    }
  }

  // 3. Fallback
  const id = fallbackShareTokenIndex.get(token);
  if (!id) return undefined;
  return fallbackProfiles.get(id);
}

export async function getAllProfiles(): Promise<MedicalProfile[]> {
  // Firestore
  if (firestoreAvailable && db) {
    try {
      const snapshot = await db
        .collection(COLLECTION)
        .orderBy("updatedAt", "desc")
        .limit(50)
        .get();

      const profiles = snapshot.docs.map((doc) =>
        firestoreToProfile(doc.data())
      );

      // Populate cache while we have the data
      for (const p of profiles) {
        cacheProfile(p);
      }

      return profiles;
    } catch (err) {
      console.error("[store] Firestore getAllProfiles error:", err);
    }
  }

  // Fallback
  return Array.from(fallbackProfiles.values()).sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function saveProfile(profile: MedicalProfile): Promise<void> {
  // Always update cache
  cacheProfile(profile);

  // Firestore
  if (firestoreAvailable && db) {
    try {
      await db
        .collection(COLLECTION)
        .doc(profile.id)
        .set(profileToFirestore(profile));
      return;
    } catch (err) {
      console.error("[store] Firestore saveProfile error:", err);
    }
  }

  // Fallback
  fallbackProfiles.set(profile.id, profile);
  fallbackShareTokenIndex.set(profile.shareToken, profile.id);
}

export async function deleteProfile(id: string): Promise<boolean> {
  // Try to get the profile first (for shareToken cache invalidation)
  const profile = await getProfile(id);
  if (!profile) return false;

  invalidateCache(id, profile.shareToken);

  // Firestore
  if (firestoreAvailable && db) {
    try {
      await db.collection(COLLECTION).doc(id).delete();
      return true;
    } catch (err) {
      console.error("[store] Firestore deleteProfile error:", err);
    }
  }

  // Fallback
  fallbackShareTokenIndex.delete(profile.shareToken);
  fallbackProfiles.delete(id);
  return true;
}
