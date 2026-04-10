export interface Job {
  id: string;
  title: string;
  company: string;
  payRange: string;
  tags: string[];
  shortDescription: string;
  description: string;
  category: string;
  experienceLevel: string;
  skillsRequired: string[];
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
