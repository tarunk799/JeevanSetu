import { NextRequest, NextResponse } from "next/server";
import { analyzeWithGemini } from "@/lib/gemini";
import { analyzeRequestSchema } from "@/lib/validation";
import { sanitizeTextInput, sanitizeImageInput } from "@/lib/sanitize";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import type { Medication, LabResult, Condition, Allergy, AnalysisResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for") ?? "unknown";

  // Rate limiting: 10 requests per minute per IP
  const rl = checkRateLimit(`analyze:${clientIp}`, { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    logger.warn("Rate limit exceeded", { ip: clientIp, endpoint: "/api/analyze" });
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const rawBody = await request.json();

    // Validate input with Zod
    const parseResult = analyzeRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((i) => i.message);
      return NextResponse.json(
        { success: false, error: "Invalid input", details: errors },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const body = parseResult.data;

    // Sanitize inputs
    const sanitizedText = body.text ? sanitizeTextInput(body.text) : undefined;
    const sanitizedImage = body.image ? sanitizeImageInput(body.image) : undefined;

    logger.info("Analysis started", { type: body.type, hasImage: !!body.image, hasText: !!body.text });

    const rawResult = await analyzeWithGemini(body.type, sanitizedImage, sanitizedText);
    const response = transformResult(body.type, rawResult);

    logger.info("Analysis complete", { type: body.type, confidence: response.confidence });

    return NextResponse.json(response, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    logger.error("Analysis failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Analysis failed. Please try again." },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}

function transformResult(
  type: string,
  raw: Record<string, unknown>
): AnalysisResponse {
  switch (type) {
    case "prescription":
      return transformPrescription(raw);
    case "lab_report":
      return transformLabReport(raw);
    case "medicine_photo":
      return transformMedicinePhoto(raw);
    case "voice_text":
    case "free_text":
      return transformTextInput(raw);
    default:
      return { success: true, data: {}, confidence: 0, warnings: [] };
  }
}

function transformPrescription(raw: Record<string, unknown>): AnalysisResponse {
  const meds = (raw.medications as Array<Record<string, unknown>>) ?? [];
  const medications: Medication[] = meds.map((m) => ({
    name: String(m.name ?? ""),
    dosage: String(m.dosage ?? ""),
    frequency: String(m.frequency ?? ""),
    duration: m.duration ? String(m.duration) : undefined,
    prescribedFor: m.prescribedFor ? String(m.prescribedFor) : undefined,
    confidence: Number(m.confidence) || 0,
  }));

  const avgConfidence = medications.length
    ? medications.reduce((sum, m) => sum + m.confidence, 0) / medications.length
    : 0;

  const patientInfo: { name?: string } = {};
  const pn = raw.patientName as Record<string, unknown> | undefined;
  if (pn?.value) patientInfo.name = String(pn.value);

  return {
    success: true,
    data: { medications, patientInfo },
    confidence: avgConfidence,
    warnings: (raw.warnings as string[]) ?? [],
  };
}

function transformLabReport(raw: Record<string, unknown>): AnalysisResponse {
  const results = (raw.results as Array<Record<string, unknown>>) ?? [];
  const labResults: LabResult[] = results.map((r) => ({
    testName: String(r.testName ?? ""),
    value: String(r.value ?? ""),
    unit: String(r.unit ?? ""),
    referenceRange: String(r.referenceRange ?? ""),
    status: (r.status as "normal" | "warning" | "critical") || "normal",
    date: String(raw.date ?? new Date().toISOString().split("T")[0]),
    labName: raw.labName ? String(raw.labName) : undefined,
    confidence: Number(r.confidence) || 0,
  }));

  const avgConfidence = labResults.length
    ? labResults.reduce((sum, r) => sum + r.confidence, 0) / labResults.length
    : 0;

  return {
    success: true,
    data: {
      labResults,
      patientInfo: { name: raw.patientName ? String(raw.patientName) : undefined },
    },
    confidence: avgConfidence,
    warnings: labResults
      .filter((r) => r.status !== "normal")
      .map((r) => `${r.status.toUpperCase()}: ${r.testName} is ${r.value} ${r.unit} (ref: ${r.referenceRange})`),
  };
}

function transformMedicinePhoto(raw: Record<string, unknown>): AnalysisResponse {
  const medication: Medication = {
    name: String(raw.brandName ?? raw.genericName ?? ""),
    dosage: String(raw.strength ?? ""),
    frequency: "",
    confidence: Number(raw.confidence) || 0,
  };

  return {
    success: true,
    data: { medications: [medication] },
    confidence: Number(raw.confidence) || 0,
    warnings: (raw.warnings as string[]) ?? [],
  };
}

function transformTextInput(raw: Record<string, unknown>): AnalysisResponse {
  const rawMeds = (raw.medications as Array<Record<string, unknown>>) ?? [];
  const rawConditions = (raw.conditions as Array<Record<string, unknown>>) ?? [];
  const rawAllergies = (raw.allergies as Array<Record<string, unknown>>) ?? [];

  const medications: Medication[] = rawMeds
    .filter((m) => m.name)
    .map((m) => ({
      name: String(m.name),
      dosage: String(m.dosage ?? ""),
      frequency: String(m.frequency ?? ""),
      confidence: Number(m.confidence) || 0,
    }));

  const conditions: Condition[] = rawConditions
    .filter((c) => c.name)
    .map((c) => ({
      name: String(c.name),
      status: (c.status as "active" | "resolved") || "active",
    }));

  const allergies: Allergy[] = rawAllergies
    .filter((a) => a.allergen)
    .map((a) => ({
      allergen: String(a.allergen),
      severity: (a.severity as "mild" | "moderate" | "severe") || "moderate",
      reaction: a.reaction ? String(a.reaction) : undefined,
    }));

  const allConfidences = [
    ...rawMeds.map((m) => Number(m.confidence) || 0),
    ...rawConditions.map((c) => Number(c.confidence) || 0),
    ...rawAllergies.map((a) => Number(a.confidence) || 0),
  ];
  const avgConfidence = allConfidences.length
    ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
    : 0;

  return {
    success: true,
    data: { medications, conditions, allergies },
    confidence: avgConfidence,
    warnings: [],
  };
}
