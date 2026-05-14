import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Predict from "./pages/Predict";
import Result from "./pages/Result";
import Workforce from "./pages/Workforce";
import About from "./pages/About";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/admin/Dashboard";
import Companies from "./pages/admin/Companies";
import AdminSettings from "./pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/home" element={<Home />} />
                <Route path="/predict" element={<Predict />} />
                <Route path="/result" element={<Result />} />
                <Route path="/workforce" element={<Workforce />} />
                <Route path="/about" element={<About />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<ProtectedRoute role="admin"><Dashboard /></ProtectedRoute>} />
                <Route path="/companies" element={<ProtectedRoute role="admin"><Companies /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
