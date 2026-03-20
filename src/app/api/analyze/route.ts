import { NextRequest, NextResponse } from "next/server";
import { analyzeWithGemini } from "@/lib/gemini";
import { AnalysisRequest, AnalysisResponse, Medication, LabResult, Condition, Allergy } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();

    if (!body.type) {
      return NextResponse.json({ success: false, error: "Missing analysis type" }, { status: 400 });
    }

    if (["prescription", "lab_report", "medicine_photo"].includes(body.type) && !body.image) {
      return NextResponse.json({ success: false, error: "Image required for this analysis type" }, { status: 400 });
    }

    if (["voice_text", "free_text"].includes(body.type) && !body.text) {
      return NextResponse.json({ success: false, error: "Text required for this analysis type" }, { status: 400 });
    }

    const rawResult = await analyzeWithGemini(body.type, body.image, body.text);
    const response = transformResult(body.type, rawResult);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Analysis error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { success: false, error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

function transformResult(
  type: AnalysisRequest["type"],
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
  const meds = raw.medications as Array<Record<string, unknown>> || [];
  const medications: Medication[] = meds.map((m) => ({
    name: String(m.name || ""),
    dosage: String(m.dosage || ""),
    frequency: String(m.frequency || ""),
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
    warnings: (raw.warnings as string[]) || [],
  };
}

function transformLabReport(raw: Record<string, unknown>): AnalysisResponse {
  const results = raw.results as Array<Record<string, unknown>> || [];
  const labResults: LabResult[] = results.map((r) => ({
    testName: String(r.testName || ""),
    value: String(r.value || ""),
    unit: String(r.unit || ""),
    referenceRange: String(r.referenceRange || ""),
    status: (r.status as "normal" | "warning" | "critical") || "normal",
    date: String(raw.date || new Date().toISOString().split("T")[0]),
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
    warnings: labResults.filter((r) => r.status !== "normal").map(
      (r) => `${r.status.toUpperCase()}: ${r.testName} is ${r.value} ${r.unit} (ref: ${r.referenceRange})`
    ),
  };
}

function transformMedicinePhoto(raw: Record<string, unknown>): AnalysisResponse {
  const medication: Medication = {
    name: String(raw.brandName || raw.genericName || ""),
    dosage: String(raw.strength || ""),
    frequency: "",
    confidence: Number(raw.confidence) || 0,
  };

  return {
    success: true,
    data: { medications: [medication] },
    confidence: Number(raw.confidence) || 0,
    warnings: (raw.warnings as string[]) || [],
  };
}

function transformTextInput(raw: Record<string, unknown>): AnalysisResponse {
  const rawMeds = raw.medications as Array<Record<string, unknown>> || [];
  const rawConditions = raw.conditions as Array<Record<string, unknown>> || [];
  const rawAllergies = raw.allergies as Array<Record<string, unknown>> || [];

  const medications: Medication[] = rawMeds
    .filter((m) => m.name)
    .map((m) => ({
      name: String(m.name),
      dosage: String(m.dosage || ""),
      frequency: String(m.frequency || ""),
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
