import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  LogOut,
  Menu,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Recent Problems', href: '/dashboard/recent', icon: AlertCircle },
  { name: 'Progress Problems', href: '/dashboard/progress', icon: Clock },
  { name: 'Solved Problems', href: '/dashboard/solved', icon: CheckCircle2 },
  { name: 'Report Generation', href: '/dashboard/reports', icon: BarChart3 },
];

const departmentNames: Record<string, string> = {
  municipal: 'Municipal Department',
  panchayat: 'Panchayat',
  town_panchayat: 'Town Panchayat',
  corporation: 'Corporation',
  water: 'Water Department',
  energy: 'Energy Department',
  pwd: 'Public Works Department',
};

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleProfileToggle = () => {
    if (location.pathname === '/dashboard/profile') {
      // If already on profile page, go back to Recent Problems
      navigate('/dashboard/recent');
    } else {
      // If not on profile page, navigate to profile
      navigate('/dashboard/profile');
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-[0px] border-solid border-[#3785d4ff] bg-[#0a506dff] bg-none">
        <div className="flex items-center gap-3">
          <img
            src="/images/deptlogo.png"
            alt="Department Logo"
            className="h-10 w-10 object-contain"
          />
          <div>
            <h2 className="font-semibold text-sidebar-foreground">
              {profile?.department ? departmentNames[profile.department] : 'Department'}
            </h2>
            <p className="text-xs text-sidebar-foreground/70">{profile?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 bg-[#ffffffff] bg-none">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#1b95ca] text-black'
                  : 'text-black hover:bg-[#3083a7] hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2 bg-[#ffffffff] bg-none">
        {profile?.role === 'admin' && (
          <Link to="/admin" onClick={() => setSidebarOpen(false)}>

          </Link>
        )}
        <Button
          className="w-full justify-start hover:bg-[#1b95ca] hover:text-white transition-colors border-0 text-black bg-white"
          size="sm"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 border-b border-border px-4 py-3 bg-[#0a506dff] bg-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="bg-transparent hover:bg-transparent border-0">
                    <Menu className="h-5 w-5 text-white" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80 bg-sidebar border-r border-sidebar-border">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              <div>
                <h1 className="text-lg font-semibold text-[#ffffffff]">
                  Civic Issue Management System
                </h1>
                <p className="text-xs text-[#ffffffff]">
                  {profile?.full_name || 'Official'} • {profile?.role === 'admin' ? 'Administrator' : 'Official'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-transparent hover:bg-white/10 border-0"
                onClick={handleProfileToggle}
              >
                <User className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 xl:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
