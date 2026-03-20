import { describe, it, expect } from "vitest";
import { analyzeRequestSchema, createProfileSchema } from "@/lib/validation";

describe("analyzeRequestSchema", () => {
  it("accepts valid prescription request with image", () => {
    const result = analyzeRequestSchema.safeParse({
      type: "prescription",
      image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid free_text request", () => {
    const result = analyzeRequestSchema.safeParse({
      type: "free_text",
      text: "I have diabetes and take metformin 500mg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects prescription without image", () => {
    const result = analyzeRequestSchema.safeParse({
      type: "prescription",
    });
    expect(result.success).toBe(false);
  });

  it("rejects free_text without text", () => {
    const result = analyzeRequestSchema.safeParse({
      type: "free_text",
    });
    expect(result.success).toBe(false);
  });

  it("rejects text shorter than 10 characters", () => {
    const result = analyzeRequestSchema.safeParse({
      type: "free_text",
      text: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid analysis type", () => {
    const result = analyzeRequestSchema.safeParse({
      type: "invalid_type",
      text: "some long enough text here",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid image format", () => {
    const result = analyzeRequestSchema.safeParse({
      type: "prescription",
      image: "not-a-base64-image",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional profileId as UUID", () => {
    const result = analyzeRequestSchema.safeParse({
      type: "free_text",
      text: "I have diabetes and high blood pressure",
      profileId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid profileId format", () => {
    const result = analyzeRequestSchema.safeParse({
      type: "free_text",
      text: "I have diabetes and high blood pressure",
      profileId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("createProfileSchema", () => {
  it("accepts valid profile with all fields", () => {
    const result = createProfileSchema.safeParse({
      patientName: "Priya Sharma",
      bloodType: "B+",
      medications: [
        { name: "Metformin 500mg", dosage: "500mg", frequency: "Twice daily", confidence: 0.95 },
      ],
      allergies: [{ allergen: "Sulfonamides", severity: "severe" }],
      conditions: [{ name: "Type 2 Diabetes", status: "active" }],
      labResults: [
        {
          testName: "HbA1c",
          value: "8.4",
          unit: "%",
          referenceRange: "4.0-5.6",
          status: "critical",
          date: "2026-03-15",
          confidence: 0.95,
        },
      ],
      emergencyContacts: [{ name: "Amit Sharma", phone: "9876543210", relation: "Husband" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal profile with only name", () => {
    const result = createProfileSchema.safeParse({
      patientName: "Minimal Patient",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.medications).toEqual([]);
      expect(result.data.allergies).toEqual([]);
    }
  });

  it("rejects empty patient name", () => {
    const result = createProfileSchema.safeParse({
      patientName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid blood type", () => {
    const result = createProfileSchema.safeParse({
      patientName: "Test",
      bloodType: "Z+",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid allergy severity", () => {
    const result = createProfileSchema.safeParse({
      patientName: "Test",
      allergies: [{ allergen: "Peanuts", severity: "extreme" }],
    });
    expect(result.success).toBe(false);
  });

  it("enforces max 5 emergency contacts", () => {
    const result = createProfileSchema.safeParse({
      patientName: "Test",
      emergencyContacts: Array(6).fill({ name: "A", phone: "12345", relation: "Friend" }),
    });
    expect(result.success).toBe(false);
  });
});
