// DEMO ONLY — mock data για το B2B marketplace. Δεν αγγίζει Prisma/DB.
// Όταν κλειδώσει το concept, αυτά γίνονται Prisma models.

export type LabCaseStatus =
  | "OPEN"
  | "QUOTED"
  | "ASSIGNED"
  | "IN_PRODUCTION"
  | "READY"
  | "DELIVERED"
  | "COMPLETED";

export type LabCaseType =
  | "Στεφάνη"
  | "Γέφυρα"
  | "Ένθετο/Επένθετο"
  | "Όψη"
  | "Ολική Οδοντοστοιχία"
  | "Μερική Οδοντοστοιχία"
  | "Νάρθηκας"
  | "Εμφυτευματική εργασία"
  | "Νάρθηκας ορθοδοντικής";

export interface Lab {
  id: string;
  name: string;
  city: string;
  rating: number;
  reviewCount: number;
  completedCases: number;
  avgLeadTimeDays: number;
  verified: boolean;
  isDentoraLab?: boolean;
  equipment: string[];
  materials: string[];
  priceFrom: number;
  description: string;
}

export interface LabOffer {
  id: string;
  labId: string;
  price: number;
  leadTimeDays: number;
  message: string;
  createdAt: string;
  prevCollaborations?: number;
}

export interface LabCase {
  id: string;
  code: string; // π.χ. LAB-2026-0142 (pseudonymized, χωρίς στοιχεία ασθενούς)
  type: LabCaseType;
  material: string;
  shade: string;
  units: number;
  deadline: string;
  priority: "Standard" | "Express";
  status: LabCaseStatus;
  description: string;
  files: { name: string; size: string; kind: "STL" | "PHOTO" | "XRAY" | "PDF" }[];
  offers: LabOffer[];
  assignedLabId?: string;
  finalPrice?: number;
  dentistName: string;
  createdAt: string;
}

export const COMMISSION_RATE = 10;

export function commissionOf(price: number, rate = COMMISSION_RATE) {
  return Math.round(((price * rate) / 100) * 100) / 100;
}

export function labPayout(price: number, rate = COMMISSION_RATE) {
  return Math.round((price - commissionOf(price, rate)) * 100) / 100;
}

export const MOCK_LABS: Lab[] = [
  {
    id: "smile-lab",
    name: "Dentora Smile Lab",
    city: "Αθήνα",
    rating: 4.9,
    reviewCount: 212,
    completedCases: 1840,
    avgLeadTimeDays: 4,
    verified: true,
    isDentoraLab: true,
    equipment: ["5-axis Milling", "3D Printing", "Intraoral scan ready", "Sintering"],
    materials: ["Zirconia", "e.max", "PMMA", "Resin"],
    priceFrom: 65,
    description:
      "Το εργαστήριο της Dentora. Εγγυημένοι χρόνοι, δωρεάν remake σε αστοχία υλικού.",
  },
  {
    id: "lab-2",
    name: "Aesthetic Dental Lab",
    city: "Θεσσαλονίκη",
    rating: 4.8,
    reviewCount: 134,
    completedCases: 960,
    avgLeadTimeDays: 5,
    verified: true,
    equipment: ["3D Printing", "Ceramic layering"],
    materials: ["e.max", "Zirconia", "Feldspathic"],
    priceFrom: 70,
    description: "Εξειδίκευση σε όψεις και πρόσθια αισθητική.",
  },
  {
    id: "lab-3",
    name: "ProImplant Lab",
    city: "Πάτρα",
    rating: 4.7,
    reviewCount: 89,
    completedCases: 640,
    avgLeadTimeDays: 6,
    verified: true,
    equipment: ["CAD/CAM", "Titanium milling", "3D Printing"],
    materials: ["Titanium", "Zirconia", "Co-Cr"],
    priceFrom: 90,
    description: "Εμφυτευματικές εργασίες, μπάρες και βιδωτές.",
  },
  {
    id: "lab-4",
    name: "Digital Denture Studio",
    city: "Ηράκλειο",
    rating: 4.6,
    reviewCount: 57,
    completedCases: 410,
    avgLeadTimeDays: 7,
    verified: true,
    equipment: ["3D Printing", "Digital dentures"],
    materials: ["Resin", "PMMA", "Flexible"],
    priceFrom: 120,
    description: "Ολικές / μερικές με ψηφιακή ροή.",
  },
  {
    id: "lab-5",
    name: "Express Mill Center",
    city: "Αθήνα",
    rating: 4.5,
    reviewCount: 203,
    completedCases: 2100,
    avgLeadTimeDays: 2,
    verified: true,
    equipment: ["5-axis Milling x4", "Express sintering"],
    materials: ["Zirconia", "PMMA"],
    priceFrom: 55,
    description: "Express παραδόσεις 24-48h για επείγοντα.",
  },
];

export const MOCK_CASES: LabCase[] = [
  {
    id: "case-1",
    code: "LAB-2026-0142",
    type: "Στεφάνη",
    material: "Zirconia monolithic",
    shade: "A2",
    units: 1,
    deadline: "2026-09-24",
    priority: "Standard",
    status: "QUOTED",
    dentistName: "Δρ. Παπαδόπουλος",
    createdAt: "2026-09-14",
    description:
      "Στεφάνη #26, chamfer, αντίπαλο άθικτο. Scan άνω/κάτω + bite. Φωτογραφία shade με guide.",
    files: [
      { name: "upper-arch.stl", size: "84 MB", kind: "STL" },
      { name: "lower-arch.stl", size: "71 MB", kind: "STL" },
      { name: "bite.stl", size: "22 MB", kind: "STL" },
      { name: "shade-A2.jpg", size: "3.1 MB", kind: "PHOTO" },
    ],
    offers: [
      { id: "o1", labId: "smile-lab", price: 85, leadTimeDays: 4, message: "Παράδοση Πέμπτη με courier. Δωρεάν glaze.", createdAt: "2026-09-15", prevCollaborations: 12 },
      { id: "o2", labId: "lab-2", price: 95, leadTimeDays: 5, message: "Layered για καλύτερη αισθητική.", createdAt: "2026-09-15", prevCollaborations: 3 },
      { id: "o3", labId: "lab-5", price: 68, leadTimeDays: 2, message: "Express 48h, monolithic.", createdAt: "2026-09-16", prevCollaborations: 0 },
    ],
  },
  {
    id: "case-2",
    code: "LAB-2026-0141",
    type: "Όψη",
    material: "e.max x3",
    shade: "BL2",
    units: 3,
    deadline: "2026-09-30",
    priority: "Standard",
    status: "OPEN",
    dentistName: "Δρ. Γεωργίου",
    createdAt: "2026-09-13",
    description: "Όψεις 13-23, mockup εγκεκριμένο. Ζητείται cut-back + layering.",
    files: [
      { name: "pre-op.stl", size: "66 MB", kind: "STL" },
      { name: "mockup.stl", size: "40 MB", kind: "STL" },
      { name: "smile-photos.zip", size: "18 MB", kind: "PHOTO" },
    ],
    offers: [
      { id: "o4", labId: "lab-2", price: 390, leadTimeDays: 7, message: "Με φωτό τελικού πριν το glaze.", createdAt: "2026-09-14", prevCollaborations: 8 },
    ],
  },
  {
    id: "case-3",
    code: "LAB-2026-0139",
    type: "Εμφυτευματική εργασία",
    material: "Zirconia σε τιτάνιο",
    shade: "A3",
    units: 2,
    deadline: "2026-09-22",
    priority: "Express",
    status: "ASSIGNED",
    dentistName: "Δρ. Νικολάου",
    createdAt: "2026-09-12",
    description: "Βιδωτές 36, 37 σε Straumann RC. Torque 35Ncm.",
    files: [
      { name: "implant-scan.stl", size: "92 MB", kind: "STL" },
      { name: "rx-36-37.jpg", size: "1.2 MB", kind: "XRAY" },
    ],
    assignedLabId: "smile-lab",
    finalPrice: 240,
    offers: [
      { id: "o5", labId: "smile-lab", price: 240, leadTimeDays: 5, message: "Αποδεκτή.", createdAt: "2026-09-12", prevCollaborations: 20 },
      { id: "o6", labId: "lab-3", price: 260, leadTimeDays: 6, message: "Με Ti-base original.", createdAt: "2026-09-12", prevCollaborations: 1 },
    ],
  },
  {
    id: "case-4",
    code: "LAB-2026-0135",
    type: "Νάρθηκας",
    material: "PMMA printed",
    shade: "—",
    units: 1,
    deadline: "2026-09-26",
    priority: "Standard",
    status: "OPEN",
    dentistName: "Δρ. Κωνσταντίνου",
    createdAt: "2026-09-10",
    description: "Νυχτερινός νάρθηκας άνω γνάθου, hard/soft.",
    files: [{ name: "upper.stl", size: "58 MB", kind: "STL" }],
    offers: [],
  },
];

export function labById(id: string): Lab | undefined {
  return MOCK_LABS.find((l) => l.id === id);
}

export const STATUS_META: Record<LabCaseStatus, { label: string; classes: string }> = {
  OPEN: { label: "Ανοιχτή", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  QUOTED: { label: "Με προσφορές", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  ASSIGNED: { label: "Ανατέθηκε", classes: "bg-violet-50 text-violet-700 border-violet-200" },
  IN_PRODUCTION: { label: "Παραγωγή", classes: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  READY: { label: "Έτοιμη", classes: "bg-teal-50 text-teal-700 border-teal-200" },
  DELIVERED: { label: "Παραδόθηκε", classes: "bg-green-50 text-green-700 border-green-200" },
  COMPLETED: { label: "Ολοκληρώθηκε", classes: "bg-gray-100 text-gray-700 border-gray-200" },
};

export const WORK_TYPES: LabCaseType[] = [
  "Στεφάνη",
  "Γέφυρα",
  "Ένθετο/Επένθετο",
  "Όψη",
  "Ολική Οδοντοστοιχία",
  "Μερική Οδοντοστοιχία",
  "Νάρθηκας",
  "Εμφυτευματική εργασία",
  "Νάρθηκας ορθοδοντικής",
];

export const MATERIALS = [
  "Zirconia monolithic",
  "Zirconia layered",
  "e.max",
  "PMMA",
  "Metal-Ceramic",
  "Titanium",
  "Resin printed",
  "Flexible",
];

export const SHADES = ["A1", "A2", "A3", "A3.5", "B1", "B2", "BL2", "C2", "—"];
