import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { complaintApi } from '@/db/api';
import type { ComplaintWithProfile } from '@/types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MapPin, Calendar, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageModal } from '@/components/ui/image-modal';

export default function SolvedProblems() {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const loadComplaints = async () => {
      setLoading(true);
      const data = await complaintApi.getComplaintsByStatus('completed', profile?.department);
      setComplaints(data);
      setLoading(false);
    };

    loadComplaints();
  }, [profile]);

  const calculateResolutionTime = (createdAt: string, resolvedAt: string | null) => {
    if (!resolvedAt) return 'N/A';
    const created = new Date(createdAt).getTime();
    const resolved = new Date(resolvedAt).getTime();
    const hours = Math.round((resolved - created) / (1000 * 60 * 60));
    if (hours < 24) return `${hours} hours`;
    const days = Math.round(hours / 24);
    return `${days} days`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Solved Problems</h2>
          <p className="text-muted-foreground">Historical record of resolved complaints</p>
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

  return (
    <div className="space-y-6">
      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
      />

      <div>
        <h2 className="text-2xl font-bold text-foreground">Solved Problems</h2>
        <p className="text-muted-foreground">Historical record of all resolved complaints</p>
      </div>

      {complaints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No solved complaints yet</p>
            <p className="text-sm text-muted-foreground">Completed complaints will appear here</p>
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
                        Reported: {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Resolved: {complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className="bg-secondary text-secondary-foreground">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Solved
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">{complaint.description}</p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {complaint.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Resolution time: {calculateResolutionTime(complaint.created_at, complaint.resolved_at)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {complaint.complaint_images && complaint.complaint_images.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Complaint Images</p>
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
                    </div>
                  )}

                  {complaint.solution_image && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Solution Image</p>
                      <div
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedImage(complaint.solution_image)}
                      >
                        <img
                          src={complaint.solution_image}
                          alt="Solution"
                          className="h-24 w-24 object-cover rounded-lg border border-border group-hover:opacity-90 transition-opacity"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {complaint.assigned_profile && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Resolved by: {complaint.assigned_profile.full_name || complaint.assigned_profile.email}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
