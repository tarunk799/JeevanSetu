import { z } from "zod/v4";

/** Maximum image size: 10MB base64 (~13.3MB encoded) */
const MAX_IMAGE_SIZE = 14_000_000;

const base64ImageSchema = z
  .string()
  .max(MAX_IMAGE_SIZE, "Image too large (max 10MB)")
  .regex(/^data:image\/(jpeg|png|gif|webp|bmp);base64,/, "Invalid image format. Supported: JPEG, PNG, GIF, WebP");

export const analyzeRequestSchema = z
  .object({
    type: z.enum(["prescription", "lab_report", "medicine_photo", "voice_text", "free_text"]),
    image: base64ImageSchema.optional(),
    text: z.string().min(10, "Text must be at least 10 characters").max(5000, "Text must be under 5000 characters").optional(),
    profileId: z.string().uuid("Invalid profile ID").optional(),
  })
  .refine(
    (data) => {
      if (["prescription", "lab_report", "medicine_photo"].includes(data.type)) return !!data.image;
      if (["voice_text", "free_text"].includes(data.type)) return !!data.text;
      return true;
    },
    { message: "Image required for image types, text required for text types" }
  );

export const createProfileSchema = z.object({
  patientName: z.string().min(1, "Patient name required").max(200),
  dateOfBirth: z.string().optional(),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        phone: z.string().min(5).max(20),
        relation: z.string().min(1).max(100),
      })
    )
    .max(5)
    .default([]),
  medications: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        dosage: z.string().max(100).default(""),
        frequency: z.string().max(200).default(""),
        duration: z.string().max(100).optional(),
        prescribedFor: z.string().max(200).optional(),
        prescribedBy: z.string().max(200).optional(),
        startDate: z.string().optional(),
        confidence: z.number().min(0).max(1).default(0),
      })
    )
    .max(50)
    .default([]),
  allergies: z
    .array(
      z.object({
        allergen: z.string().min(1).max(200),
        severity: z.enum(["mild", "moderate", "severe"]),
        reaction: z.string().max(500).optional(),
      })
    )
    .max(20)
    .default([]),
  conditions: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        diagnosedDate: z.string().optional(),
        status: z.enum(["active", "resolved"]).default("active"),
      })
    )
    .max(30)
    .default([]),
  labResults: z
    .array(
      z.object({
        testName: z.string().min(1).max(200),
        value: z.string().min(1).max(50),
        unit: z.string().max(50).default(""),
        referenceRange: z.string().max(100).default(""),
        status: z.enum(["normal", "warning", "critical"]).default("normal"),
        date: z.string().default(""),
        labName: z.string().max(200).optional(),
        confidence: z.number().min(0).max(1).default(0),
      })
    )
    .max(100)
    .default([]),
});

export const updateProfileSchema = createProfileSchema.partial();

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type CreateProfileRequest = z.infer<typeof createProfileSchema>;
