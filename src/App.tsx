import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
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
import ForgotPassword from "./pages/ForgotPassword";
import StudentNotifications from "./pages/StudentNotifications";
import Terms from "./pages/Terms";
import Certificates from "./pages/Certificates";
import News from "./pages/News";
import VideoHomeworkPage from "./pages/VideoHomeworkPage";
import NotFound from "./pages/NotFound";
import ParentLogin from "./pages/ParentLogin";
import ParentDashboard from "./pages/ParentDashboard";
import Schedule from "./pages/Schedule";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/auth/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/auth/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/subscribe" element={<PageTransition><Subscribe /></PageTransition>} />
        <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
        <Route path="/subject/:subject" element={<PageTransition><SubjectVideos /></PageTransition>} />
        <Route path="/video-homework/:videoId" element={<PageTransition><VideoHomeworkPage /></PageTransition>} />
        <Route path="/exam/:examId" element={<PageTransition><TakeExam /></PageTransition>} />
        <Route path="/my-results" element={<PageTransition><MyResults /></PageTransition>} />
        <Route path="/homework" element={<PageTransition><Homework /></PageTransition>} />
        <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
        <Route path="/question-bank" element={<PageTransition><QuestionBank /></PageTransition>} />
        <Route path="/report" element={<PageTransition><StudentReport /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/student-notifications" element={<PageTransition><StudentNotifications /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/certificates" element={<PageTransition><Certificates /></PageTransition>} />
        <Route path="/news" element={<PageTransition><News /></PageTransition>} />
        <Route path="/parent/login" element={<PageTransition><ParentLogin /></PageTransition>} />
        <Route path="/parent/dashboard" element={<PageTransition><ParentDashboard /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
