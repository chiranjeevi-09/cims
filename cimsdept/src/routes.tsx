import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Login from './pages/Login';
import Admin from './pages/Admin';
import DashboardLayout from './components/layout/DashboardLayout';
import RecentProblems from './pages/dashboard/RecentProblems';
import ProgressProblems from './pages/dashboard/ProgressProblems';
import SolvedProblems from './pages/dashboard/SolvedProblems';
import Reports from './pages/dashboard/Reports';
import Profile from './pages/dashboard/Profile';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  children?: RouteConfig[];
}

const routes: RouteConfig[] = [
  {
    name: 'Root',
    path: '/',
    element: <Navigate to="/dashboard/recent" replace />,
  },
  {
    name: 'Login',
    path: '/login',
    element: <Login />,
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      {
        name: 'Dashboard Index',
        path: '/dashboard',
        element: <Navigate to="/dashboard/recent" replace />,
      },
      {
        name: 'Recent Problems',
        path: '/dashboard/recent',
        element: <RecentProblems />,
      },
      {
        name: 'Progress Problems',
        path: '/dashboard/progress',
        element: <ProgressProblems />,
      },
      {
        name: 'Solved Problems',
        path: '/dashboard/solved',
        element: <SolvedProblems />,
      },
      {
        name: 'Reports',
        path: '/dashboard/reports',
        element: <Reports />,
      },
      {
        name: 'Profile',
        path: '/dashboard/profile',
        element: <Profile />,
      },
    ],
  },
  {
    name: 'Admin',
    path: '/admin',
    element: <Admin />,
  },
];

export default routes;
