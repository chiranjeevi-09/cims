import { motion } from 'framer-motion';
import { CheckCircle2, MapPin, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useIssues } from '@/contexts/IssueContext';
import { departmentLabels } from '@/types/issue';
import { format } from 'date-fns';
import { useState } from 'react';
import { ImageModal } from '@/components/ui/image-modal';

export default function SolvedIssues() {
  const { user } = useAuth();
  const { getIssuesByStatus } = useIssues();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const solvedIssues = getIssuesByStatus(user?.id || '', 'completed');

  const calculateResolutionTime = (createdAt: Date, resolvedAt?: Date) => {
    if (!resolvedAt) return 'N/A';
    const hours = Math.round((resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
    if (hours < 24) return `${hours} hours`;
    const days = Math.round(hours / 24);
    return `${days} days`;
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Solved Issues</h1>
        <p className="text-muted-foreground">Historical record of all resolved complaints</p>
      </motion.div>

      {/* Issues List */}
      <div className="grid gap-4">
        {solvedIssues.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No solved issues yet</p>
              <p className="text-sm text-muted-foreground">Completed complaints will appear here</p>
            </CardContent>
          </Card>
        ) : (
          solvedIssues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow border-success/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          Reported: {format(issue.createdAt, 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-success font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Resolved: {issue.resolvedAt ? format(issue.resolvedAt, 'MMM d, yyyy') : 'N/A'}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className="bg-success text-success-foreground shrink-0 ml-2">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Solved
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {issue.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {issue.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Resolution time: {calculateResolutionTime(issue.createdAt, issue.resolvedAt)}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-medium px-2 py-0 border-muted-foreground/30">
                      {departmentLabels[issue.department]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Complaint Image */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Complaint Image</p>
                      <div
                        className="relative group cursor-zoom-in overflow-hidden rounded-lg border border-border"
                        onClick={() => setSelectedImage(issue.imageUrl)}
                      >
                        <img
                          src={issue.imageUrl}
                          alt="Complaint"
                          className="h-28 w-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      </div>
                    </div>

                    {/* Solution Image */}
                    {(issue.solvedImageUrl) && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-success">Solution Image</p>
                        <div
                          className="relative group cursor-zoom-in overflow-hidden rounded-lg border border-success/30"
                          onClick={() => setSelectedImage(issue.solvedImageUrl || null)}
                        >
                          <img
                            src={issue.solvedImageUrl}
                            alt="Solution"
                            className="h-28 w-full object-cover group-hover:opacity-90 transition-opacity"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

