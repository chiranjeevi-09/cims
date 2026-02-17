import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { complaintApi, storageApi } from '@/db/api';
import type { ComplaintWithProfile, ProgressStage } from '@/types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Bell, TrendingUp, CheckCircle, MapPin, Calendar, Loader2, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { compressImage, validateImageFile } from '@/utils/imageCompression';
import { ImageModal } from '@/components/ui/image-modal';

export default function ProgressProblems() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<ComplaintWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithProfile | null>(null);
  const [solutionImage, setSolutionImage] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadComplaints = async () => {
    setLoading(true);
    const data = await complaintApi.getComplaintsByStatus('in_progress', profile?.department);
    setComplaints(data);
    setLoading(false);
  };

  useEffect(() => {
    loadComplaints();
  }, [profile]);

  const handleStageUpdate = async (complaintId: string, stage: ProgressStage) => {
    setActionLoading(complaintId);
    const success = await complaintApi.updateProgressStage(complaintId, stage);

    if (success) {
      toast({
        title: 'Status Updated',
        description: `Complaint moved to ${stage} stage.`,
      });
      loadComplaints();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    }
    setActionLoading(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: 'Invalid File',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);
    try {
      const compressedFile = await compressImage(file);
      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);

      if (compressedFile.size < file.size) {
        toast({
          title: 'Image Compressed',
          description: `Image compressed from ${originalSize}MB to ${compressedSize}MB`,
        });
      }

      setSolutionImage(compressedFile);
    } catch (error) {
      toast({
        title: 'Compression Failed',
        description: 'Failed to process image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCompleteWithImage = async () => {
    if (!selectedComplaint || !solutionImage) return;

    setActionLoading(selectedComplaint.id);
    setUploadingImage(true);

    try {
      const timestamp = Date.now();
      const fileName = `solution_${selectedComplaint.id}_${timestamp}.webp`;
      const imageUrl = await storageApi.uploadImage(solutionImage, fileName);

      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      const success = await complaintApi.updateProgressStage(
        selectedComplaint.id,
        'completed',
        imageUrl
      );

      if (success) {
        toast({
          title: 'Complaint Completed',
          description: 'The complaint has been marked as completed with solution image.',
        });
        setSelectedComplaint(null);
        setSolutionImage(null);
        loadComplaints();
      } else {
        throw new Error('Failed to update complaint status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete complaint. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
      setActionLoading(null);
    }
  };

  const getStageComplaints = (stage: ProgressStage) => {
    return complaints.filter((c) => c.progress_stage === stage);
  };

  const getIconColor = (currentStage: ProgressStage | null, iconStage: ProgressStage) => {
    if (!currentStage) return 'text-muted-foreground';
    const stages: ProgressStage[] = ['notified', 'progress', 'completed'];
    const currentIndex = stages.indexOf(currentStage);
    const iconIndex = stages.indexOf(iconStage);

    return iconIndex <= currentIndex ? 'text-green-500' : 'text-muted-foreground';
  };

  const renderComplaintCard = (complaint: ComplaintWithProfile) => (
    <Card key={complaint.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
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

          {/* Status Indicators */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <Bell className={`h-6 w-6 ${getIconColor(complaint.progress_stage, 'notified')}`} />
              <span className="text-xs text-muted-foreground">Notified</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <TrendingUp className={`h-6 w-6 ${getIconColor(complaint.progress_stage, 'progress')}`} />
              <span className="text-xs text-muted-foreground">Progress</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CheckCircle className={`h-6 w-6 ${getIconColor(complaint.progress_stage, 'completed')}`} />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground">{complaint.description}</p>

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
          {complaint.progress_stage === 'notified' && (
            <Button
              onClick={() => handleStageUpdate(complaint.id, 'progress')}
              disabled={actionLoading === complaint.id}
              className="flex-1"
            >
              {actionLoading === complaint.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Start Work
                </>
              )}
            </Button>
          )}

          {complaint.progress_stage === 'progress' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="flex-1"
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Completed
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete Complaint</DialogTitle>
                  <DialogDescription>
                    Upload a solution image to mark this complaint as completed
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Solution Image</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      {solutionImage ? (
                        <div className="space-y-2">
                          <img
                            src={URL.createObjectURL(solutionImage)}
                            alt="Solution preview"
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <p className="text-sm text-muted-foreground">
                            {solutionImage.name} ({(solutionImage.size / 1024 / 1024).toFixed(2)}MB)
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSolutionImage(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <Label
                            htmlFor="solution-upload"
                            className="cursor-pointer text-primary hover:underline"
                          >
                            Click to upload solution image
                          </Label>
                          <input
                            id="solution-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Max 1MB • JPEG, PNG, WEBP, GIF
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleCompleteWithImage}
                    disabled={!solutionImage || uploadingImage || actionLoading === selectedComplaint?.id}
                    className="w-full"
                  >
                    {uploadingImage || actionLoading === selectedComplaint?.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Complaint'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {complaint.progress_stage === 'completed' && complaint.solution_image && (
            <div className="flex-1 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Complaint resolved successfully
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Progress Problems</h2>
          <p className="text-muted-foreground">Track complaints through resolution stages</p>
        </div>
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-muted" />
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

  return (
    <div className="space-y-6">
      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
      />

      <div>
        <h2 className="text-2xl font-bold text-foreground">Progress Problems</h2>
        <p className="text-muted-foreground">
          Track and manage complaints through resolution stages. Each complaint shows its current progress with status indicators.
        </p>
      </div>

      <div className="space-y-4">
        {complaints.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No complaints in progress</p>
              <p className="text-sm text-muted-foreground mt-2">
                Accepted complaints will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          complaints.map(renderComplaintCard)
        )}
      </div>
    </div>
  );
}
