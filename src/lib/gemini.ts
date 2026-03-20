import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const PROMPTS = {
  prescription: `You are a medical document analyzer. Analyze this prescription image and extract structured information.

Extract:
1. Patient name (if visible)
2. Doctor name and specialization (if visible)
3. Date of prescription
4. Each medication: drug name, dosage, frequency, duration, prescribed for what condition
5. Diagnosis mentioned
6. Special instructions or warnings

IMPORTANT RULES:
- Only extract information you can clearly read. Do not guess.
- For each extracted field, provide a confidence score (0.0 to 1.0)
- Flag potential drug interactions if you detect multiple medications
- If text is in a non-English script, note the language and mark as "requires_translation"

Return ONLY valid JSON in this exact format:
{
  "patientName": { "value": "", "confidence": 0.0 },
  "doctorName": { "value": "", "confidence": 0.0 },
  "date": "YYYY-MM-DD",
  "medications": [
    {
      "name": "",
      "dosage": "",
      "frequency": "",
      "duration": "",
      "prescribedFor": "",
      "confidence": 0.0
    }
  ],
  "diagnosis": "",
  "warnings": [],
  "language": "en",
  "requiresTranslation": false
}`,

  lab_report: `You are a medical lab report analyzer. Extract all test results from this lab report image.

Extract:
1. Patient name, age, gender
2. Date of report
3. Lab/hospital name
4. Each test: test name, measured value, unit, reference range
5. Flag values outside reference range as WARNING (slightly out) or CRITICAL (significantly out)

IMPORTANT: Only extract what you can clearly read. Provide confidence scores.

Return ONLY valid JSON:
{
  "patientName": "",
  "age": "",
  "gender": "",
  "date": "YYYY-MM-DD",
  "labName": "",
  "results": [
    {
      "testName": "",
      "value": "",
      "unit": "",
      "referenceRange": "",
      "status": "normal",
      "confidence": 0.0
    }
  ]
}`,

  medicine_photo: `Identify the medication from this photo of a medicine package/strip.

Extract:
1. Drug/brand name
2. Generic name (active ingredient)
3. Dosage/strength
4. Manufacturer
5. Common uses
6. Key warnings or contraindications

Return ONLY valid JSON:
{
  "brandName": "",
  "genericName": "",
  "strength": "",
  "manufacturer": "",
  "commonUses": [],
  "warnings": [],
  "confidence": 0.0
}`,

  voice_text: `You are a medical information extractor. The following is a patient's description of their medical history (transcribed from voice or typed). Extract structured medical information.

Patient says: "{input_text}"

Extract:
1. Chronic conditions or diagnoses mentioned
2. Current medications (with dosage if mentioned)
3. Known allergies (with severity if mentioned)
4. Past surgeries or procedures
5. Family medical history
6. Current symptoms

IMPORTANT: Only extract what is explicitly stated. Do not infer or assume.

Return ONLY valid JSON:
{
  "conditions": [{ "name": "", "status": "active", "confidence": 0.0 }],
  "medications": [{ "name": "", "dosage": "", "frequency": "", "confidence": 0.0 }],
  "allergies": [{ "allergen": "", "severity": "moderate", "reaction": "", "confidence": 0.0 }],
  "surgeries": [{ "procedure": "", "date": "", "confidence": 0.0 }],
  "familyHistory": [],
  "currentSymptoms": []
}`,

  free_text: `You are a medical information extractor. The following is a patient's description of their medical history. Extract structured medical information.

Patient says: "{input_text}"

Extract:
1. Chronic conditions or diagnoses mentioned
2. Current medications (with dosage if mentioned)
3. Known allergies (with severity if mentioned)
4. Past surgeries or procedures
5. Family medical history
6. Current symptoms

IMPORTANT: Only extract what is explicitly stated. Do not infer or assume.

Return ONLY valid JSON:
{
  "conditions": [{ "name": "", "status": "active", "confidence": 0.0 }],
  "medications": [{ "name": "", "dosage": "", "frequency": "", "confidence": 0.0 }],
  "allergies": [{ "allergen": "", "severity": "moderate", "reaction": "", "confidence": 0.0 }],
  "surgeries": [{ "procedure": "", "date": "", "confidence": 0.0 }],
  "familyHistory": [],
  "currentSymptoms": []
}`,
};

export async function analyzeWithGemini(
  type: keyof typeof PROMPTS,
  imageBase64?: string,
  text?: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let prompt = PROMPTS[type];
  if (text) {
    prompt = prompt.replace("{input_text}", text);
  }

  const parts: (string | Part)[] = [prompt];

  if (imageBase64) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    parts.push({
      inlineData: { data: base64Data, mimeType },
    });
  }

  const result = await model.generateContent(parts);
  const response = result.response;
  const responseText = response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON found in Gemini response");
  }

  return JSON.parse(jsonMatch[0]);
}
