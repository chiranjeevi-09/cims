import { supabase } from './supabase';
import type {
  Profile,
  Complaint,
  ComplaintRedirect,
  ComplaintWithProfile,
  DepartmentType,
  ComplaintStatus,
  ProgressStage,
  ComplaintCategory,
  ReportData,
} from '@/types/types';

export const profileApi = {
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('dept_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('dept_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<boolean> {
    const { error } = await supabase
      .from('dept_profiles')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }
    return true;
  },
};

export const complaintApi = {
  async getComplaintsByStatus(status: ComplaintStatus, department?: DepartmentType): Promise<ComplaintWithProfile[]> {
    let query = supabase
      .from('complaints')
      .select(`
        *,
        assigned_profile:dept_profiles!complaints_assigned_to_fkey(*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (department) {
      query = query.or(`assigned_department.eq.${department},assigned_department.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching complaints:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  async getComplaintsByDepartment(department: DepartmentType): Promise<ComplaintWithProfile[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        assigned_profile:dept_profiles!complaints_assigned_to_fkey(*)
      `)
      .or(`assigned_department.eq.${department},assigned_department.is.null`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching complaints by department:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  async getComplaintById(id: string): Promise<ComplaintWithProfile | null> {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        assigned_profile:dept_profiles!complaints_assigned_to_fkey(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching complaint:', error);
      return null;
    }
    return data;
  },

  async acceptComplaint(
    complaintId: string,
    assignedTo: string,
    assignedDepartment: DepartmentType
  ): Promise<boolean> {
    const { error } = await supabase.rpc('update_complaint_status', {
      complaint_id_param: complaintId,
      new_status: 'in_progress',
      new_stage: 'notified',
    });

    if (error) {
      console.error('Error in RPC:', error);
      return false;
    }

    const { error: updateError } = await supabase
      .from('complaints')
      .update({
        assigned_to: assignedTo,
        assigned_department: assignedDepartment,
      })
      .eq('id', complaintId);

    if (updateError) {
      console.error('Error accepting complaint:', updateError);
      return false;
    }

    // Context: Notify the citizen
    try {
      const { data: complaint } = await supabase
        .from('complaints')
        .select('citizen_email, title')
        .eq('id', complaintId)
        .single();

      if (complaint?.citizen_email) {
        // Find the user ID from the email
        const { data: userProfile } = await supabase
          .from('citizen_profiles')
          .select('id')
          .eq('email', complaint.citizen_email)
          .maybeSingle();

        if (userProfile?.id) {
          await supabase.from('notifications').insert({
            user_id: userProfile.id,
            title: "Complaint Accepted",
            message: `Your complaint "${complaint.title}" has been accepted.`,
            is_read: false
          });
        }
      }
    } catch (notifyError) {
      console.error("Error sending notification:", notifyError);
      // Don't fail the operation just because notification failed
    }

    return true;
  },

  async redirectComplaint(
    complaintId: string,
    fromDepartment: DepartmentType,
    toDepartment: DepartmentType,
    redirectedBy: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('redirect_complaint_rpc', {
        complaint_id_param: complaintId,
        new_department: toDepartment,
        redirected_by_param: redirectedBy,
        from_dept_param: fromDepartment,
        reason_param: reason || null
      });

      if (error) {
        console.error('Error redirecting complaint:', error);
        if (error.code === '42501') {
          console.error('RLS ERROR: Your database policy prevents changing departments. Please run 00003_fix_redirection_permissions.sql script in Supabase SQL editor.');
        }
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error during redirection:', err);
      return false;
    }
  },

  async updateProgressStage(
    complaintId: string,
    stage: ProgressStage,
    solutionImage?: string
  ): Promise<boolean> {
    const status: ComplaintStatus = stage === 'completed' ? 'completed' : 'in_progress';

    const { error } = await supabase.rpc('update_complaint_status', {
      complaint_id_param: complaintId,
      new_status: status,
      new_stage: stage,
      solution_image_param: solutionImage || null,
    });

    if (error) {
      console.error('Error updating progress stage:', error);
      return false;
    }
    return true;
  },

  async categorizeComplaint(complaintText: string): Promise<ComplaintCategory> {
    const { data, error } = await supabase.rpc('categorize_complaint', {
      complaint_text: complaintText,
    });

    if (error) {
      console.error('Error categorizing complaint:', error);
      return 'other';
    }
    return data as ComplaintCategory;
  },

  async getComplaintsForReport(startDate: Date, endDate: Date, department?: DepartmentType): Promise<Complaint[]> {
    let query = supabase
      .from('complaints')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (department) {
      query = query.eq('assigned_department', department);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching complaints for report:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  async generateReportData(startDate: Date, endDate: Date, department?: DepartmentType): Promise<ReportData> {
    const complaints = await this.getComplaintsForReport(startDate, endDate, department);

    const totalComplaints = complaints.length;
    const solvedIssues = complaints.filter(c => c.status === 'completed').length;
    const pendingIssues = complaints.filter(c => c.status !== 'completed').length;

    const resolvedComplaints = complaints.filter(c => c.resolved_at);
    const totalResolutionTime = resolvedComplaints.reduce((sum, c) => {
      const created = new Date(c.created_at).getTime();
      const resolved = new Date(c.resolved_at!).getTime();
      return sum + (resolved - created);
    }, 0);
    const averageResolutionTime = resolvedComplaints.length > 0
      ? totalResolutionTime / resolvedComplaints.length / (1000 * 60 * 60)
      : 0;

    const locationMap = new Map<string, number>();
    complaints.forEach(c => {
      const count = locationMap.get(c.location) || 0;
      locationMap.set(c.location, count + 1);
    });
    const locationDistribution = Array.from(locationMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);

    const categoryMap = new Map<string, number>();
    complaints.forEach(c => {
      const category = c.category || 'other';
      const count = categoryMap.get(category) || 0;
      categoryMap.set(category, count + 1);
    });
    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }));

    const dateMap = new Map<string, number>();
    complaints.forEach(c => {
      const date = new Date(c.created_at).toISOString().split('T')[0];
      const count = dateMap.get(date) || 0;
      dateMap.set(date, count + 1);
    });
    const dailyTrends = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_complaints: totalComplaints,
      solved_issues: solvedIssues,
      pending_issues: pendingIssues,
      average_resolution_time: Math.round(averageResolutionTime * 10) / 10,
      location_distribution: locationDistribution,
      category_distribution: categoryDistribution,
      daily_trends: dailyTrends,
    };
  },
};

export const redirectApi = {
  async getRedirectsByComplaint(complaintId: string): Promise<ComplaintRedirect[]> {
    const { data, error } = await supabase
      .from('complaint_redirects')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching redirects:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },
};

export const storageApi = {
  async uploadImage(file: File, path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('app-84dd1k6elqm9_complaints_images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('app-84dd1k6elqm9_complaints_images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from('app-84dd1k6elqm9_complaints_images')
      .getPublicUrl(path);

    return data.publicUrl;
  },
};
