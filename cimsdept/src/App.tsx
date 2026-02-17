import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import routes from './routes';
import type { ReactNode } from 'react';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster />
        <Routes>
          {routes.map((route, index) => {
            if (route.path === '/login') {
              return <Route key={index} path={route.path} element={route.element} />;
            }

            if (route.children) {
              return (
                <Route
                  key={index}
                  path={route.path}
                  element={<PrivateRoute>{route.element}</PrivateRoute>}
                >
                  {route.children.map((child, childIndex) => (
                    <Route key={childIndex} path={child.path} element={child.element} />
                  ))}
                </Route>
              );
            }

            return (
              <Route
                key={index}
                path={route.path}
                element={<PrivateRoute>{route.element}</PrivateRoute>}
              />
            );
          })}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
