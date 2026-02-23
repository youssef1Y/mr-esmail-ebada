import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Subscribe from "./pages/Subscribe";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import SubjectVideos from "./pages/SubjectVideos";
import TakeExam from "./pages/TakeExam";
import MyResults from "./pages/MyResults";
import Homework from "./pages/Homework";
import Leaderboard from "./pages/Leaderboard";
import QuestionBank from "./pages/QuestionBank";
import StudentReport from "./pages/StudentReport";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/subject/:subject" element={<SubjectVideos />} />
          <Route path="/exam/:examId" element={<TakeExam />} />
          <Route path="/my-results" element={<MyResults />} />
          <Route path="/homework" element={<Homework />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/question-bank" element={<QuestionBank />} />
          <Route path="/report" element={<StudentReport />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
