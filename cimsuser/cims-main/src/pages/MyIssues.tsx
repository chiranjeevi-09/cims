import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { IssueCard } from '@/components/issues/IssueCard';
import { useAuth } from '@/contexts/AuthContext';
import { useIssues } from '@/contexts/IssueContext';
import { IssueStatus, statusLabels } from '@/types/issue';

export default function MyIssues() {
  const { user } = useAuth();
  const { getUserIssues } = useIssues();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');

  const myIssues = getUserIssues(user?.id || '');
  
  const filteredIssues = myIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions: Array<{ value: IssueStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: statusLabels.pending },
    { value: 'seen', label: statusLabels.seen },
    { value: 'progress', label: statusLabels.progress },
    { value: 'completed', label: statusLabels.completed },
  ];

  return (
    <div className="px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Uploaded Issues</h1>
            <p className="text-muted-foreground text-sm">{myIssues.length} issues reported</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your issues..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-4">
        {statusOptions.map((option) => (
          <Badge
            key={option.value}
            variant={statusFilter === option.value ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setStatusFilter(option.value)}
          >
            {option.label}
          </Badge>
        ))}
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No issues found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {myIssues.length === 0 
                ? "You haven't reported any issues yet" 
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          filteredIssues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <IssueCard
                issue={issue}
                onClick={() => navigate(`/issue/${issue.id}`)}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
