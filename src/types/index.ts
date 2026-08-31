export interface StudentProfile {
  id: string;
  user_id: string;
  first_name: string;
  age: number | null;
  school_year: string | null;
  country: string | null;
  curriculum: string | null;
  subjects: string[];
  created_at: string;
  updated_at: string;
}

export type VoicePreference = "female" | "male" | "neutral";

export interface TeacherProfile {
  id: string;
  student_id: string;
  teacher_name: string;
  voice_preference: VoicePreference;
  personality: string;
  created_at: string;
  updated_at: string;
}

export const SUBJECT_OPTIONS = [
  "Mathematics",
  "English",
  "Science",
  "Biology",
  "Chemistry",
  "Physics",
  "History",
  "Geography",
  "Computer Science",
  "Languages",
  "Art",
  "Music",
] as const;

export const CURRICULUM_OPTIONS = [
  "England (National Curriculum / GCSE)",
  "Scotland (CfE)",
  "US Common Core",
  "International Baccalaureate (IB)",
  "Cambridge International",
  "Australian Curriculum",
  "Other",
] as const;

export const PERSONALITY_OPTIONS = [
  { value: "encouraging", label: "Encouraging", hint: "Patient, warm, celebrates progress" },
  { value: "socratic", label: "Socratic", hint: "Asks questions, guides you to answers" },
  { value: "direct", label: "Direct", hint: "Clear, concise, gets to the point" },
  { value: "playful", label: "Playful", hint: "Light, funny, keeps it fun" },
] as const;

export const VOICE_OPTIONS: { value: VoicePreference; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "neutral", label: "Neutral" },
];
