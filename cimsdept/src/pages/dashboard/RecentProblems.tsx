import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { complaintApi } from '@/db/api';
import type { ComplaintWithProfile, DepartmentType } from '@/types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, MapPin, Mail, Calendar, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageModal } from '@/components/ui/image-modal';
import { analyzeRedirectDepartment } from '@/services/GeminiService';

export default function RecentProblems() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<ComplaintWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithProfile | null>(null);
  const [redirectReason, setRedirectReason] = useState('');
  const [redirectDialogOpen, setRedirectDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadComplaints = async () => {
    setLoading(true);
    const data = await complaintApi.getComplaintsByStatus('new', profile?.department);
    setComplaints(data);
    setLoading(false);
  };

  useEffect(() => {
    loadComplaints();
  }, [profile]);

  const handleAccept = async (complaint: ComplaintWithProfile) => {
    if (!profile) return;

    setActionLoading(complaint.id);
    const success = await complaintApi.acceptComplaint(
      complaint.id,
      profile.id,
      profile.department
    );

    if (success) {
      toast({
        title: 'Complaint Accepted',
        description: 'The complaint has been assigned to your department.',
      });
      loadComplaints();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to accept complaint. Please try again.',
        variant: 'destructive',
      });
    }
    setActionLoading(null);
  };

  const handleRedirect = async () => {
    if (!selectedComplaint || !profile) return;

    setActionLoading(selectedComplaint.id);

    try {
      let targetDepartment: DepartmentType = 'municipal';

      // Use AI to analyze the image if available
      if (selectedComplaint.complaint_images && selectedComplaint.complaint_images.length > 0) {
        toast({
          title: 'AI Analyzing',
          description: 'Analyzing the issue to find the appropriate department...',
        });

        const aiDept = await analyzeRedirectDepartment(
          selectedComplaint.complaint_images[0],
          selectedComplaint.description
        );

        if (aiDept) {
          targetDepartment = aiDept;
        } else {
          // Fallback to text-based categorization if image analysis fails
          const categoryText = `${selectedComplaint.title} ${selectedComplaint.description}`;
          const suggestedCategory = await complaintApi.categorizeComplaint(categoryText);
          if (suggestedCategory === 'water') targetDepartment = 'water';
          else if (suggestedCategory === 'electricity') targetDepartment = 'energy';
          else if (suggestedCategory === 'pwd') targetDepartment = 'pwd';
        }
      } else {
        // Fallback for no image
        const categoryText = `${selectedComplaint.title} ${selectedComplaint.description}`;
        const suggestedCategory = await complaintApi.categorizeComplaint(categoryText);
        if (suggestedCategory === 'water') targetDepartment = 'water';
        else if (suggestedCategory === 'electricity') targetDepartment = 'energy';
        else if (suggestedCategory === 'pwd') targetDepartment = 'pwd';
      }

      const success = await complaintApi.redirectComplaint(
        selectedComplaint.id,
        profile.department,
        targetDepartment,
        profile.id,
        redirectReason || `AI-categorized as ${targetDepartment}`
      );

      if (success) {
        toast({
          title: 'Complaint Redirected',
          description: `The complaint has been redirected to ${targetDepartment} department.`,
        });
        setRedirectDialogOpen(false);
        setSelectedComplaint(null);
        setRedirectReason('');
        loadComplaints();
      } else {
        throw new Error('Redirect failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to redirect complaint. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Recent Problems</h2>
          <p className="text-muted-foreground">New complaints awaiting review</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-muted" />
                <Skeleton className="h-4 w-1/2 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Define departments that CANNOT redirect (only accept)
  const restrictedDepartments: DepartmentType[] = ['water', 'energy', 'pwd'];
  const canRedirect = profile && !restrictedDepartments.includes(profile.department);

  return (
    <div className="space-y-6">
      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
      />

      <div>
        <h2 className="text-2xl font-bold text-foreground">Recent Problems</h2>
        <p className="text-muted-foreground">New complaints awaiting review and action</p>
      </div>

      {complaints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No new complaints</p>
            <p className="text-sm text-muted-foreground">All complaints have been reviewed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{complaint.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {complaint.location}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">{complaint.description}</p>

                {complaint.citizen_email && (
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {complaint.citizen_email}
                    </span>
                  </div>
                )}

                {complaint.complaint_images && complaint.complaint_images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {complaint.complaint_images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedImage(img)}
                      >
                        <img
                          src={img}
                          alt={`Complaint ${idx + 1}`}
                          className="h-24 w-24 object-cover rounded-lg border border-border group-hover:opacity-90 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleAccept(complaint)}
                    disabled={actionLoading === complaint.id}
                    className="flex-1 bg-[#0a506d] hover:bg-[#0a506d] text-white"
                  >
                    {actionLoading === complaint.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept
                      </>
                    )}
                  </Button>

                  {canRedirect && (
                    <Dialog
                      open={redirectDialogOpen && selectedComplaint?.id === complaint.id}
                      onOpenChange={(open) => {
                        setRedirectDialogOpen(open);
                        if (!open) {
                          setSelectedComplaint(null);
                          setRedirectReason('');
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="flex-1 bg-[#0a506d] hover:bg-[#0a506d] text-white"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setRedirectDialogOpen(true);
                          }}
                        >
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Redirect
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Redirect Complaint</DialogTitle>
                          <DialogDescription>
                            AI will automatically analyze and forward this complaint to the appropriate department
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              The system will analyze the complaint image and content to automatically redirect it to the most suitable department (Water, Energy, or PWD).
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Reason (Optional)</Label>
                            <Textarea
                              value={redirectReason}
                              onChange={(e) => setRedirectReason(e.target.value)}
                              placeholder="Provide a reason for redirecting..."
                              rows={3}
                            />
                          </div>
                          <Button
                            onClick={handleRedirect}
                            disabled={actionLoading === selectedComplaint?.id}
                            className="w-full"
                          >
                            {actionLoading === selectedComplaint?.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                AI Analyzing & Redirecting...
                              </>
                            ) : (
                              'Confirm Redirect with AI'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
