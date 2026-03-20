import { describe, it, expect, beforeEach } from "vitest";
import {
  getProfile,
  getProfileByShareToken,
  getAllProfiles,
  saveProfile,
  deleteProfile,
} from "@/lib/store";
import type { MedicalProfile } from "@/lib/types";

function makeProfile(overrides: Partial<MedicalProfile> = {}): MedicalProfile {
  return {
    id: "test-id-1",
    patientName: "Test Patient",
    bloodType: "A+",
    emergencyContacts: [],
    medications: [],
    allergies: [],
    conditions: [],
    labResults: [],
    shareToken: "share-token-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("Profile store", () => {
  beforeEach(async () => {
    await deleteProfile("test-id-1");
    await deleteProfile("test-id-2");
    await deleteProfile("test-id-3");
  });

  describe("saveProfile + getProfile", () => {
    it("saves and retrieves a profile by ID", async () => {
      const profile = makeProfile();
      await saveProfile(profile);

      const result = await getProfile("test-id-1");
      expect(result).toBeDefined();
      expect(result?.patientName).toBe("Test Patient");
      expect(result?.bloodType).toBe("A+");
    });

    it("returns undefined for non-existent ID", async () => {
      expect(await getProfile("non-existent")).toBeUndefined();
    });
  });

  describe("getProfileByShareToken", () => {
    it("retrieves a profile by share token", async () => {
      const profile = makeProfile();
      await saveProfile(profile);

      const result = await getProfileByShareToken("share-token-1");
      expect(result).toBeDefined();
      expect(result?.id).toBe("test-id-1");
    });

    it("returns undefined for non-existent share token", async () => {
      expect(await getProfileByShareToken("bad-token")).toBeUndefined();
    });
  });

  describe("getAllProfiles", () => {
    it("returns profiles sorted by updatedAt (newest first)", async () => {
      await saveProfile(makeProfile({ id: "test-id-2", shareToken: "st-2", updatedAt: "2026-01-01T00:00:00Z" }));
      await saveProfile(makeProfile({ id: "test-id-3", shareToken: "st-3", updatedAt: "2026-03-01T00:00:00Z" }));

      const all = await getAllProfiles();
      const ids = all.map((p) => p.id);
      expect(ids.indexOf("test-id-3")).toBeLessThan(ids.indexOf("test-id-2"));
    });
  });

  describe("deleteProfile", () => {
    it("deletes a profile and its share token index", async () => {
      const profile = makeProfile();
      await saveProfile(profile);

      expect(await deleteProfile("test-id-1")).toBe(true);
      expect(await getProfile("test-id-1")).toBeUndefined();
      expect(await getProfileByShareToken("share-token-1")).toBeUndefined();
    });

    it("returns false for non-existent profile", async () => {
      expect(await deleteProfile("non-existent")).toBe(false);
    });
  });

  describe("profile update", () => {
    it("overwrites existing profile on re-save", async () => {
      await saveProfile(makeProfile({ patientName: "Old Name" }));
      await saveProfile(makeProfile({ patientName: "New Name" }));

      const result = await getProfile("test-id-1");
      expect(result?.patientName).toBe("New Name");
    });
  });
});
