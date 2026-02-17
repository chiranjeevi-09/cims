import React, { createContext, useContext, useState, useEffect } from 'react';
import { CivicIssue, IssueStatus, IssueCategory, IssueDepartment } from '@/types/issue';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface IssueContextType {
  issues: CivicIssue[];
  addIssue: (issue: Omit<CivicIssue, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIssueStatus: (id: string, status: IssueStatus) => Promise<void>;
  getUserIssues: (userId: string) => CivicIssue[];
  getIssuesByStatus: (userId: string, status: IssueStatus | IssueStatus[]) => CivicIssue[];
  loading: boolean;
}

const IssueContext = createContext<IssueContextType | undefined>(undefined);

// Helper to map DB status to UI status
const mapDbToUiStatus = (dbStatus: string, progressStage?: string): IssueStatus => {
  switch (dbStatus) {
    case 'new': return 'pending';
    case 'in_progress':
      return progressStage === 'progress' ? 'progress' : 'seen';
    case 'completed': return 'completed';
    case 'redirected': return 'pending'; // Treat redirected as pending for user
    default: return 'pending';
  }
};

// Map UI status to DB status
const mapUiToDbStatus = (uiStatus: IssueStatus): string => {
  switch (uiStatus) {
    case 'pending': return 'new';
    case 'seen': return 'in_progress';
    case 'progress': return 'in_progress';
    case 'completed': return 'completed';
    default: return 'new';
  }
};

// Map UI category to DB category
const mapUiToDbCategory = (uiCategory: IssueCategory): string => {
  switch (uiCategory) {
    case 'road_damage': return 'pwd';
    case 'streetlight': return 'electricity';
    case 'drainage': return 'water'; // Closest match
    case 'garbage': return 'other'; // No garbage category in DB
    case 'water_supply': return 'water';
    case 'electricity': return 'electricity';
    case 'public_property': return 'pwd';
    case 'other': return 'other';
    default: return 'other';
  }
};

// Map DB category to UI category (Approximation)
const mapDbToUiCategory = (dbCategory: string): IssueCategory => {
  switch (dbCategory) {
    case 'water': return 'water_supply';
    case 'electricity': return 'electricity';
    case 'pwd': return 'road_damage';
    case 'other': return 'other';
    default: return 'other';
  }
};


export function IssueProvider({ children }: { children: React.ReactNode }) {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedIssues: CivicIssue[] = (data as any[]).map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: mapDbToUiCategory(item.category), // Best effort mapping
          department: (item.assigned_department as IssueDepartment) || 'municipal', // Default
          status: mapDbToUiStatus(item.status, item.progress_stage),
          location: item.location,
          latitude: item.latitude,
          longitude: item.longitude,
          imageUrl: item.complaint_images?.[0] || '', // Take first image
          solvedImageUrl: item.solution_image || '',
          userId: item.assigned_to || '',
          userName: item.citizen_name,
          citizenEmail: item.citizen_email,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          resolvedAt: item.resolved_at ? new Date(item.resolved_at) : undefined,
          city: item.city || '',
        }));
        setIssues(mappedIssues);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues(); // Initial fetch

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:complaints')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
        fetchIssues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addIssue = async (issue: Omit<CivicIssue, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Upload image first
      let imageUrl = issue.imageUrl;
      // If image is base64, we need to upload it. If it's a URL, leave it.
      // Assumes AddProblem passes base64 data URI
      if (issue.imageUrl.startsWith('data:')) {
        const fileExt = 'png'; // Default to png for base64
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Convert base64 to blob
        const base64Response = await fetch(issue.imageUrl);
        const blob = await base64Response.blob();

        const { error: uploadError } = await supabase.storage
          .from('app-84dd1k6elqm9_complaints_images') // Using the bucket from setup_database.sql
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('app-84dd1k6elqm9_complaints_images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const dbCategory = mapUiToDbCategory(issue.category);
      const dbStatus = 'new';

      const { error } = await supabase
        .from('complaints' as any)
        .insert({
          title: issue.title,
          description: issue.description,
          category: dbCategory,
          status: dbStatus,
          citizen_name: issue.userName,
          citizen_phone: '0000000000', // Placeholder as UI doesn't collect phone
          citizen_email: user.email,
          location: issue.location,
          city: issue.city,
          assigned_department: issue.department,
          complaint_images: [imageUrl],
          // We are missing a column to link the complaint to the creating USER ID
          // I will use a workaround or check if I can add it. 
          // For now, insert allows RLS based on auth.uid() check usually.
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Complaint submitted successfully",
      });

    } catch (error: any) {
      console.error('Error adding issue:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit complaint",
        variant: "destructive",
      });
      throw error; // Re-throw to let caller handle
    }
  };

  const updateIssueStatus = async (id: string, status: IssueStatus) => {
    // Only officials update status usually, but for completeness
    const dbStatus = mapUiToDbStatus(status);
    const { error } = await supabase
      .from('complaints' as any)
      .update({ status: dbStatus })
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const getUserIssues = (userId: string) => {
    if (!user) return [];
    return issues.filter(i => i.citizenEmail === user.email);
  };

  const getIssuesByStatus = (userId: string, status: IssueStatus | IssueStatus[]) => {
    if (!user) return [];
    const statuses = Array.isArray(status) ? status : [status];
    return issues.filter(issue =>
      statuses.includes(issue.status) &&
      issue.citizenEmail === user.email
    );
  };

  return (
    <IssueContext.Provider value={{
      issues,
      addIssue,
      updateIssueStatus,
      getUserIssues,
      getIssuesByStatus,
      loading
    }}>
      {children}
    </IssueContext.Provider>
  );
}

export function useIssues() {
  const context = useContext(IssueContext);
  if (context === undefined) {
    throw new Error('useIssues must be used within an IssueProvider');
  }
  return context;
}
