export type UserRole = 'official' | 'admin';

export type DepartmentType = 
  | 'municipal' 
  | 'panchayat' 
  | 'town_panchayat' 
  | 'corporation' 
  | 'water' 
  | 'energy' 
  | 'pwd';

export type ComplaintCategory = 'water' | 'electricity' | 'pwd' | 'other';

export type ComplaintStatus = 'new' | 'in_progress' | 'completed' | 'redirected';

export type ProgressStage = 'notified' | 'progress' | 'completed';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  department: DepartmentType;
  role: UserRole;
  location: string | null;
  created_at: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory | null;
  status: ComplaintStatus;
  progress_stage: ProgressStage | null;
  citizen_name: string;
  citizen_phone: string;
  citizen_email: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  complaint_images: string[] | null;
  solution_image: string | null;
  assigned_department: DepartmentType | null;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplaintRedirect {
  id: string;
  complaint_id: string;
  from_department: DepartmentType;
  to_department: DepartmentType;
  redirected_by: string;
  reason: string | null;
  created_at: string;
}

export interface ComplaintWithProfile extends Complaint {
  assigned_profile?: Profile;
}

export interface ReportData {
  total_complaints: number;
  solved_issues: number;
  pending_issues: number;
  average_resolution_time: number;
  location_distribution: { location: string; count: number }[];
  category_distribution: { category: string; count: number }[];
  daily_trends: { date: string; count: number }[];
}

export interface TimeFilter {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
}
