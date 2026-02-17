import { MapPin, Clock, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CivicIssue, departmentLabels, categoryLabels, statusLabels } from '@/types/issue';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ImageModal } from '@/components/ui/image-modal';

interface IssueCardProps {
  issue: CivicIssue;
  onClick?: () => void;
  showStatus?: boolean;
}

export function IssueCard({ issue, onClick, showStatus = true }: IssueCardProps) {
  const [showImageModal, setShowImageModal] = useState(false);

  const statusColors = {
    pending: 'bg-pending text-pending-foreground',
    seen: 'bg-warning text-warning-foreground',
    progress: 'bg-warning text-warning-foreground',
    completed: 'bg-success text-success-foreground',
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowImageModal(true);
  };

  return (
    <>
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={issue.imageUrl}
        altText={issue.title}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50"
          onClick={onClick}
        >
          <div className="flex gap-4 p-4">
            {/* Image */}
            <div
              className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 cursor-zoom-in group"
              onClick={handleImageClick}
            >
              <img
                src={issue.imageUrl}
                alt={issue.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {showStatus && (
                <div className="absolute top-1 right-1 pointer-events-none">
                  <Badge className={cn("text-[10px] px-1.5 py-0.5", statusColors[issue.status])}>
                    {statusLabels[issue.status]}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm line-clamp-1 mb-1">
                {issue.title}
              </h3>

              <p className="text-muted-foreground text-xs line-clamp-2 mb-2">
                {issue.description}
              </p>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{issue.location}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{departmentLabels[issue.department]}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>{formatDistanceToNow(issue.createdAt, { addSuffix: true })}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium text-primary/80">
                  <span className="truncate">Reported by: {issue.userName}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  );
}

