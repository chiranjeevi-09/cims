import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusTracker } from '@/components/issues/StatusTracker';
import { useAuth } from '@/contexts/AuthContext';
import { useIssues } from '@/contexts/IssueContext';
import { departmentLabels, statusLabels } from '@/types/issue';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { ImageModal } from '@/components/ui/image-modal';

export default function ProgressIssues() {
  const { user } = useAuth();
  const { getIssuesByStatus } = useIssues();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const progressIssues = getIssuesByStatus(user?.id || '', ['pending', 'seen', 'progress']);

  const statusColors = {
    pending: 'bg-pending text-pending-foreground',
    seen: 'bg-warning text-warning-foreground',
    progress: 'bg-warning text-warning-foreground',
    completed: 'bg-success text-success-foreground',
  };

  const handleImageClick = (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation();
    setSelectedImage(imageUrl);
  };

  return (
    <div className="px-4 py-6">
      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Progress Issues</h1>
            <p className="text-muted-foreground text-sm">{progressIssues.length} issues in progress</p>
          </div>
        </div>
      </motion.div>

      {/* Issues List */}
      <div className="space-y-4">
        {progressIssues.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No issues in progress</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              All your issues have been resolved!
            </p>
          </div>
        ) : (
          progressIssues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate(`/issue/${issue.id}`)}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="cursor-zoom-in group"
                      onClick={(e) => handleImageClick(e, issue.imageUrl)}
                    >
                      <img
                        src={issue.imageUrl}
                        alt={issue.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={statusColors[issue.status]}>
                          {statusLabels[issue.status]}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                        {issue.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {departmentLabels[issue.department]}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>

                  {/* Status Tracker */}
                  <StatusTracker currentStatus={issue.status} />

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Reported {formatDistanceToNow(issue.createdAt, { addSuffix: true })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(issue.updatedAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
