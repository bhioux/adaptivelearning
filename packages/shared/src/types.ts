/**
 * Shared domain types for the Adaptive Learning Platform.
 * These contracts are used by the backend (`@al/backend`), the web client
 * (`apps/web`) and the mobile app (`apps/mobile`).
 */

export type Role = "student" | "tutor" | "parent" | "admin";

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export interface JsonObject { [key: string]: JsonValue }

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
}

export interface UserView extends UserProfile {
  twoFactorEnabled: boolean;
  displayName: string | null;
  avatar: string | null;
  createdAt: string;
}

export interface UserAdmin {
  id: string;
  email: string;
  role: Role;
  twoFactorEnabled: boolean;
  displayName: string | null;
  createdAt: string;
}

export interface ParentStudentMap {
  parentId: string;
  studentId: string;
}

export interface ClassArm {
  id: string;
  classId: string;
  armName: string;
  assignedTutorId: string | null;
  config: Record<string, JsonValue>;
  createdAt: string;
}

export interface LiveSessionSummary {
  id: string;
  classArmId: string;
  roomId: string;
  startedAt: string;
  endedAt: string | null;
}

export interface ParentSneakPeekLog {
  id: string;
  parentId: string;
  sessionId: string;
  accessedAt: string;
  durationSeconds: number;
}

export interface TutorWorkLog {
  id: string;
  tutorId: string;
  hoursWorked: number;
  ratePerHour: number;
  verified: boolean;
  payoutStatus: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  parentCourseId: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  contentUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  content: JsonValue | null;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  lessonId: string;
  type: string;
  config: Record<string, JsonValue>;
  maxScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  assessmentId: string;
  question: JsonValue;
  options: JsonValue[];
  correctAnswer: JsonValue[];
  points: number;
  difficulty: number;
  explanation: string | null;
}

export interface Submission {
  id: string;
  lessonId: string;
  studentId: string;
  answers: JsonValue;
  score: number | null;
  status: string;
  feedback: JsonValue | null;
  difficultyIntended: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
}

export interface SocialFeedPrefs {
  id: string;
  userId: string;
  topics: string[];
  mutedSources: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

export interface Payout {
  id: string;
  tutorId: string;
  amount: number;
  method: string;
  status: string;
  issuedAt: string | null;
  completedAt: string | null;
}

export interface ScormXapiRecord {
  id: string;
  userId: string;
  actor: string | null;
  verb: string;
  object: string | null;
  statement: JsonValue;
  timestamp: string | null;
  createdAt: string;
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  userId: string;
  enrolledAt: string;
}

export interface LiveAttendance {
  id: string;
  sessionId: string;
  userId: string;
  joinedAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, JsonValue>;
  ipAddress: string | null;
  createdAt: string;
}

export interface LoginResponse {
  user: UserView;
  accessToken: string;
}

export interface TfaRequiredResponse {
  userId: string;
  tfaRequired: true;
  sessionId: string;
  message: string;
}

export interface SnekPeekRequest {
  durationSeconds: number;
}
