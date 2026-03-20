export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  prescribedFor?: string;
  prescribedBy?: string;
  confidence: number;
}

export interface Allergy {
  allergen: string;
  severity: "mild" | "moderate" | "severe";
  reaction?: string;
}

export interface Condition {
  name: string;
  diagnosedDate?: string;
  status: "active" | "resolved";
}

export interface LabResult {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "normal" | "warning" | "critical";
  date: string;
  labName?: string;
  confidence: number;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface MedicalProfile {
  id: string;
  patientName: string;
  dateOfBirth?: string;
  bloodType?: string;
  emergencyContacts: EmergencyContact[];
  medications: Medication[];
  allergies: Allergy[];
  conditions: Condition[];
  labResults: LabResult[];
  shareToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisRequest {
  type: "prescription" | "lab_report" | "medicine_photo" | "voice_text" | "free_text";
  image?: string;
  text?: string;
  profileId?: string;
}

export interface AnalysisResponse {
  success: boolean;
  data: {
    medications?: Medication[];
    labResults?: LabResult[];
    conditions?: Condition[];
    allergies?: Allergy[];
    patientInfo?: { name?: string; bloodType?: string };
  };
  confidence: number;
  warnings?: string[];
}
