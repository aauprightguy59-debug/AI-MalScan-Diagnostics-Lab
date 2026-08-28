/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Patient {
  name: string;
  age: number;
  weight: number;
  gender: 'Male' | 'Female' | 'Other';
  clinicId: string;
}

export interface DiagnosticResult {
  parasiteDetected: boolean;
  species: 'Plasmodium falciparum' | 'Plasmodium vivax' | 'Plasmodium malariae' | 'Plasmodium ovale' | 'None';
  density: number; // parasites per µL
  confidenceScore: number;
  clinicalNotes: string;
}

export interface ChiefTechnician {
  id: string;
  name: string;
  title: string;
  licenseNumber: string;
  facility: string;
  role: 'Chief Lab Technician' | 'Senior Parasitologist' | 'Quality Control Director';
  loginTime: string;
}

export interface LabStaffAccount extends ChiefTechnician {
  password: string;
  createdAt: string;
}

export interface DiagnosticRecord {
  id: string;
  deviceId: string;
  patient: Patient;
  result: DiagnosticResult;
  timestamp: string;
  workerConfirmed: boolean | null; // null = pending, true = confirmed, false = flagged/override
  treatmentRegimen: string | null;
  notes: string;
  synced: boolean;
  imageKey: string; // preloaded slide key or 'uploaded'
  technician?: ChiefTechnician;
}

export interface SyncStats {
  totalScans: number;
  positiveCount: number;
  negativeCount: number;
  positivityRate: number;
  speciesBreakdown: Record<string, number>;
  avgDensity: number;
}

export interface SampleSlide {
  key: string;
  name: string;
  description: string;
  imagePath: string;
  expectedResult: DiagnosticResult;
}

export const SAMPLE_SLIDES: SampleSlide[] = [
  {
    key: 'falciparum',
    name: 'Plasmodium falciparum Smear',
    description: 'Thin blood smear with multiple delicate ring-form trophozoites and double chromatin dots in infected erythrocytes.',
    imagePath: '/assets/images/falciparum_smear_1783686249385.jpg',
    expectedResult: {
      parasiteDetected: true,
      species: 'Plasmodium falciparum',
      density: 18500,
      confidenceScore: 0.98,
      clinicalNotes: 'High-density ring forms (trophozoites) observed with characteristic double chromatin dots. High risk of rapid severe malaria progression.'
    }
  },
  {
    key: 'vivax',
    name: 'Plasmodium vivax Smear',
    description: 'Thin blood smear with enlarged red blood cells showing ameboid-form trophozoites and subtle Schüffner dots.',
    imagePath: '/assets/images/vivax_smear_1783686263162.jpg',
    expectedResult: {
      parasiteDetected: true,
      species: 'Plasmodium vivax',
      density: 4200,
      confidenceScore: 0.94,
      clinicalNotes: "Enlarged infected red blood cells containing irregular, ameboid trophozoites. Fine, eosinophilic stippling (Schüffner's dots) is present in the erythrocyte cytoplasm, confirming Plasmodium vivax."
    }
  },
  {
    key: 'malariae',
    name: 'Plasmodium malariae Smear',
    description: 'Thin blood smear exhibiting normal-sized red blood cells with distinctive band-form trophozoites stretching across the cells.',
    imagePath: '/assets/images/malariae_smear_1783686277652.jpg',
    expectedResult: {
      parasiteDetected: true,
      species: 'Plasmodium malariae',
      density: 1200,
      confidenceScore: 0.91,
      clinicalNotes: 'Compact, band-shaped trophozoites stretching across normal-sized, mature erythrocytes. Pigment is dark brown and coarse. Confirmed Plasmodium malariae with typical low-density presentation.'
    }
  },
  {
    key: 'healthy',
    name: 'Normal Healthy Control',
    description: 'Giemsa-stained thin blood smear showcasing healthy red blood cells, a polymorphonuclear white blood cell, and no intracellular inclusions.',
    imagePath: '/assets/images/normal_smear_1783686291345.jpg',
    expectedResult: {
      parasiteDetected: false,
      species: 'None',
      density: 0,
      confidenceScore: 0.99,
      clinicalNotes: "Erythrocytes exhibit normal morphology, size, and hemoglobinization. No intracellular parasites, ring forms, or Schüffner's dots detected. Healthy negative control."
    }
  }
];

export const WHO_TREATMENT_GUIDELINES: Record<string, { drugs: string[]; schedule: string; warning?: string }> = {
  'Plasmodium falciparum': {
    drugs: ['Artemether-Lumefantrine (Coartem)', 'Artesunate-Amodiaquine'],
    schedule: '6-dose regimen over 3 days. Take with fatty meal or milk to maximize absorption.',
    warning: 'Critical: Falciparum is high risk. Monitor for signs of severe malaria (cerebral symptoms, severe anemia).'
  },
  'Plasmodium vivax': {
    drugs: ['Chloroquine', 'Primaquine (to prevent relapse)'],
    schedule: 'Chloroquine for 3 days, followed by Primaquine for 14 days (subject to G6PD testing).',
    warning: 'Ensure G6PD testing has been completed before administering Primaquine to prevent acute hemolytic anemia.'
  },
  'Plasmodium malariae': {
    drugs: ['Chloroquine'],
    schedule: 'Standard 3-day course. Highly sensitive to Chloroquine.',
    warning: 'Generally mild course. Standard chloroquine dosing is highly effective.'
  },
  'Plasmodium ovale': {
    drugs: ['Chloroquine', 'Primaquine'],
    schedule: 'Chloroquine for 3 days, followed by Primaquine for 14 days for radical cure.',
    warning: 'Ensure G6PD testing has been completed before Primaquine administration.'
  },
  'None': {
    drugs: ['No antimalarials required'],
    schedule: 'Symptomatic therapy or check for other febrile illnesses (typhoid, dengue, etc.).',
    warning: 'Malaria negative. Investigate alternative etiologies for fever.'
  }
};
