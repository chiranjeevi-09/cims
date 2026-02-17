import { Check, Eye, Wrench, CheckCircle } from 'lucide-react';
import { IssueStatus } from '@/types/issue';
import { cn } from '@/lib/utils';

interface StatusTrackerProps {
  currentStatus: IssueStatus;
}

const statusSteps = [
  { status: 'pending', icon: Check, label: 'Submitted' },
  { status: 'seen', icon: Eye, label: 'Seen' },
  { status: 'progress', icon: Wrench, label: 'In Progress' },
  { status: 'completed', icon: CheckCircle, label: 'Completed' },
];

export function StatusTracker({ currentStatus }: StatusTrackerProps) {
  const currentIndex = statusSteps.findIndex(s => s.status === currentStatus);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-muted mx-8">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentIndex / (statusSteps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.status} className="flex flex-col items-center z-10">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                isCompleted 
                  ? isCurrent && currentStatus !== 'completed'
                    ? "bg-warning text-warning-foreground pulse-status"
                    : currentStatus === 'completed' && index === currentIndex
                      ? "bg-success text-success-foreground"
                      : "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                <step.icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-xs mt-2 font-medium text-center",
                isCompleted ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
