export interface Job {
  id: string;
  title: string;
  company: string;
  payRange: string;
  /** Mercor-style pay line for hero (e.g. `$0 – $65`). */
  payHeadline: string;
  /** e.g. `per hour` or `per task`. */
  payUnitLine: string;
  payType: 'per_hour' | 'per_task';
  /** Numeric bounds backing payHeadline (same units as payType). */
  payMin: number;
  payMax: number;
  contractLabel: string;
  tags: string[];
  shortDescription: string;
  description: string;
  category: string;
  experienceLevel: string;
  skillsRequired: string[];
  /** Card footer left when set (overrides hire line and company). */
  footerLeftText?: string | null;
  /** Shown as “{n} hired this month” when > 0 and footerLeftText is empty. */
  hiresThisMonth?: number | null;
  /** Card footer right next to user-plus; defaults to payHeadline. */
  footerRightText?: string | null;
  /** Extra footer line (e.g. from API); defaults to domain via `category`. */
  footerMetaText?: string | null;
}

export type UserRole = 'annotator' | 'admin' | 'qc';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  skills: string[];
  experience: string;
  bio: string;
  resumeFileName?: string;
  role?: UserRole;
  isVerified?: boolean;
  /** From profile; true after LinkedIn OAuth or import. */
  linkedinConnected?: boolean;
}

export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'interview_pending'
  | 'approved'
  | 'rejected';

export interface Application {
  id: string;
  /** Project id (same as job listing id). */
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt?: string;
  interviewScore?: number | null;
  /** Alias used by some UI components. */
  aiScore?: number | null;
  projectTitle?: string;
  rejectionReason?: string | null;
}
