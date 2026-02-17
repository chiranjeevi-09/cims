import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Building2, Clock, User, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusTracker } from '@/components/issues/StatusTracker';
import { useIssues } from '@/contexts/IssueContext';
import { departmentLabels, categoryLabels, statusLabels } from '@/types/issue';
import { format } from 'date-fns';
import { useState } from 'react';
import { ImageModal } from '@/components/ui/image-modal';

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { issues } = useIssues();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const issue = issues.find(i => i.id === id);

  if (!issue) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-muted-foreground">Issue not found</p>
        <Button variant="link" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-pending text-pending-foreground',
    seen: 'bg-warning text-warning-foreground',
    progress: 'bg-warning text-warning-foreground',
    completed: 'bg-success text-success-foreground',
  };

  return (
    <div className="pb-6">
      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
      />

      {/* Header Image */}
      <div className="relative">
        <img
          src={issue.imageUrl}
          alt={issue.title}
          className="w-full h-56 object-cover cursor-zoom-in"
          onClick={() => setSelectedImage(issue.imageUrl)}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm hover:bg-card"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Badge className={`absolute top-4 right-4 ${statusColors[issue.status]}`}>
          {statusLabels[issue.status]}
        </Badge>
      </div>

      <div className="px-4 -mt-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-4">
            {/* Title & Category */}
            <div className="mb-4">
              <Badge variant="outline" className="mb-2">
                {categoryLabels[issue.category]}
              </Badge>
              <h1 className="text-lg font-bold text-foreground">
                {issue.title}
              </h1>
            </div>

            {/* Status Tracker */}
            <div className="mb-4">
              <StatusTracker currentStatus={issue.status} />
            </div>

            <Separator className="my-4" />

            {/* Description */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {issue.description}
              </p>
            </div>

            <Separator className="my-4" />

            {/* Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Details</h3>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-foreground">{issue.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="text-foreground">{departmentLabels[issue.department]}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reported By</p>
                  <p className="text-foreground">{issue.userName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reported On</p>
                  <p className="text-foreground">{format(issue.createdAt, 'PPP')}</p>
                </div>
              </div>

              {issue.resolvedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Resolved On</p>
                    <p className="text-foreground">{format(issue.resolvedAt, 'PPP')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Solved Image */}
            {issue.status === 'completed' && issue.solvedImageUrl && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Resolution Image</h3>
                  <img
                    src={issue.solvedImageUrl}
                    alt="Resolved issue"
                    className="w-full h-40 object-cover rounded-lg cursor-zoom-in"
                    onClick={() => setSelectedImage(issue.solvedImageUrl || null)}
                  />
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

