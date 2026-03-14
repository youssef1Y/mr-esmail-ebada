import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";
import PageTransition from "@/components/PageTransition";
import AIChatAssistant from "@/components/AIChatAssistant";

// Only eagerly load the landing page
import Index from "./pages/Index";

// Lazy load all other pages
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Admin = lazy(() => import("./pages/Admin"));
const SubjectVideos = lazy(() => import("./pages/SubjectVideos"));
const TakeExam = lazy(() => import("./pages/TakeExam"));
const MyResults = lazy(() => import("./pages/MyResults"));
const Homework = lazy(() => import("./pages/Homework"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const QuestionBank = lazy(() => import("./pages/QuestionBank"));
const WeeklyCompetition = lazy(() => import("./pages/WeeklyCompetition"));
const StudentReport = lazy(() => import("./pages/StudentReport"));
const Contact = lazy(() => import("./pages/Contact"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const StudentNotifications = lazy(() => import("./pages/StudentNotifications"));
const Terms = lazy(() => import("./pages/Terms"));
const Certificates = lazy(() => import("./pages/Certificates"));
const News = lazy(() => import("./pages/News"));
const VideoHomeworkPage = lazy(() => import("./pages/VideoHomeworkPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ParentLogin = lazy(() => import("./pages/ParentLogin"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const Schedule = lazy(() => import("./pages/Schedule"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    <PageTransition>{children}</PageTransition>
  </Suspense>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth/login" element={<LazyPage><Login /></LazyPage>} />
        <Route path="/auth/register" element={<LazyPage><Register /></LazyPage>} />
        <Route path="/auth/forgot-password" element={<LazyPage><ForgotPassword /></LazyPage>} />
        <Route path="/dashboard" element={<LazyPage><Dashboard /></LazyPage>} />
        <Route path="/profile" element={<LazyPage><Profile /></LazyPage>} />
        <Route path="/subscribe" element={<LazyPage><Subscribe /></LazyPage>} />
        <Route path="/admin/login" element={<LazyPage><AdminLogin /></LazyPage>} />
        <Route path="/admin" element={<LazyPage><Admin /></LazyPage>} />
        <Route path="/subject/:subject" element={<LazyPage><SubjectVideos /></LazyPage>} />
        <Route path="/video-homework/:videoId" element={<LazyPage><VideoHomeworkPage /></LazyPage>} />
        <Route path="/exam/:examId" element={<LazyPage><TakeExam /></LazyPage>} />
        <Route path="/my-results" element={<LazyPage><MyResults /></LazyPage>} />
        <Route path="/homework" element={<LazyPage><Homework /></LazyPage>} />
        <Route path="/leaderboard" element={<LazyPage><Leaderboard /></LazyPage>} />
        <Route path="/question-bank" element={<LazyPage><QuestionBank /></LazyPage>} />
        <Route path="/weekly-competition" element={<LazyPage><WeeklyCompetition /></LazyPage>} />
        <Route path="/report" element={<LazyPage><StudentReport /></LazyPage>} />
        <Route path="/contact" element={<LazyPage><Contact /></LazyPage>} />
        <Route path="/student-notifications" element={<LazyPage><StudentNotifications /></LazyPage>} />
        <Route path="/terms" element={<LazyPage><Terms /></LazyPage>} />
        <Route path="/certificates" element={<LazyPage><Certificates /></LazyPage>} />
        <Route path="/news" element={<LazyPage><News /></LazyPage>} />
        <Route path="/schedule" element={<LazyPage><Schedule /></LazyPage>} />
        <Route path="/parent/login" element={<LazyPage><ParentLogin /></LazyPage>} />
        <Route path="/parent/dashboard" element={<LazyPage><ParentDashboard /></LazyPage>} />
        <Route path="/onboarding" element={<LazyPage><Onboarding /></LazyPage>} />
        <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
      </Routes>
    </AnimatePresence>
  );
};

const AuthenticatedChatAssistant = () => {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setAuthed(!!session));
    return () => subscription.unsubscribe();
  }, []);
  if (!authed) return null;
  return <AIChatAssistant />;
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
          <AuthenticatedChatAssistant />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
