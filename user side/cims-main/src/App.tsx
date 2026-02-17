import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { IssueProvider } from "@/contexts/IssueContext";

// Layouts
import { MobileLayout } from "@/components/layout/MobileLayout";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AddProblem from "./pages/AddProblem";
import MyIssues from "./pages/MyIssues";
import ProgressIssues from "./pages/ProgressIssues";
import SolvedIssues from "./pages/SolvedIssues";
import IssueDetail from "./pages/IssueDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <IssueProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected Routes with Mobile Layout */}
              <Route element={<MobileLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/add-problem" element={<AddProblem />} />
                <Route path="/my-issues" element={<MyIssues />} />
                <Route path="/progress" element={<ProgressIssues />} />
                <Route path="/solved" element={<SolvedIssues />} />
                <Route path="/issue/:id" element={<IssueDetail />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </IssueProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
