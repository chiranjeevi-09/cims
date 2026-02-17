import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { MobileHeader } from './MobileHeader';
import { BottomNavigation } from './BottomNavigation';
import { SideMenu } from './SideMenu';
import { useAuth } from '@/contexts/AuthContext';

export function MobileLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      <main className="pt-16 pb-6">
        <Outlet />
      </main>
    </div>
  );
}
