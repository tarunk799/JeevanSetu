/**
 * Sanitize user text input before sending to Gemini.
 * Strips potential prompt injection patterns and HTML.
 */
export function sanitizeTextInput(input: string): string {
  return input
    // Strip HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove potential prompt injection delimiters
    .replace(/```/g, "")
    // Limit consecutive newlines
    .replace(/\n{3,}/g, "\n\n")
    // Trim whitespace
    .trim();
}

/**
 * Strip EXIF data from base64 image by re-encoding.
 * For MVP, we just validate the format.
 */
export function sanitizeImageInput(base64: string): string {
  // Validate it's actually a base64 image
  const match = base64.match(/^data:(image\/(?:jpeg|png|gif|webp|bmp));base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image format");
  }
  return base64;
}

/**
 * Redact PII from log messages.
 */
export function redactForLogging(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...obj };
  const sensitiveKeys = ["image", "text", "patientName", "phone", "name"];
  for (const key of sensitiveKeys) {
    if (key in redacted) {
      redacted[key] = typeof redacted[key] === "string"
        ? `[REDACTED:${(redacted[key] as string).length} chars]`
        : "[REDACTED]";
    }
  }
  return redacted;
}
