import { X, Home, Plus, Clock, CheckCircle, FileText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/add-problem', icon: Plus, label: 'Report Problem' },
  { to: '/my-issues', icon: FileText, label: 'My Uploaded Issues' },
  { to: '/progress', icon: Clock, label: 'Progress Issues' },
  { to: '/solved', icon: CheckCircle, label: 'Solved Issues' },
];


export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { user, profile, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-card shadow-xl"
          >
            {/* Header */}
            <div className="gradient-primary p-6 pb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-primary-foreground">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary-foreground/30">
                  <AvatarImage src={profile?.avatar} alt={profile?.name} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-lg font-semibold">
                    {profile?.name?.charAt(0) || (user?.user_metadata as any)?.name?.charAt(0) || (user?.user_metadata as any)?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-primary-foreground font-semibold">{profile?.name || (user?.user_metadata as any)?.name || (user?.user_metadata as any)?.full_name || (user?.user_metadata as any)?.display_name || 'User'}</p>
                  <p className="text-primary-foreground/70 text-sm">{profile?.city || (user?.user_metadata as any)?.city || 'Not set'}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-foreground hover:bg-muted"
                  activeClassName="bg-primary/10 text-primary font-medium"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Logout */}
            <div className="absolute bottom-safe left-0 right-0 p-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
