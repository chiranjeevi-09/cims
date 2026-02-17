import { Home, Plus, Clock, CheckCircle, FileText } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/my-issues', icon: FileText, label: 'My Issues' },
  { to: '/add-problem', icon: Plus, label: 'Report', isMain: true },
  { to: '/progress', icon: Clock, label: 'Progress' },
  { to: '/solved', icon: CheckCircle, label: 'Solved' },
];

export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
              item.isMain && "relative -mt-6"
            )}
            activeClassName="text-primary"
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                {item.isMain ? (
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200",
                    isActive 
                      ? "gradient-primary shadow-glow" 
                      : "bg-primary hover:bg-primary/90"
                  )}>
                    <item.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                ) : (
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-200",
                    isActive ? "bg-primary/10" : "hover:bg-muted"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                )}
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  item.isMain && "mt-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
