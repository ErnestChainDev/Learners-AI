import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./components/Register";
import FillUpWizard from "./components/fillup/FillUpWizard";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import OAuthSuccess from "./components/OAuthSuccess";


import AppLayout from "./layouts/AppLayout";
import Home from "./pages/Home";
import { storage } from "./utils/storage";
import TakeQuiz from "./pages/TakeQuiz";
import QuizResults from "./pages/QuizResults";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Feedback from "./pages/Feedback";
import LandingPage from "./components/LandingPage";
import { Toaster } from "react-hot-toast";


function Protected({ children }: { children: React.ReactNode }) {
  const token = storage.getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
    <Toaster position="top-right" />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/landingpage" replace />} />
        <Route path="/landingpage" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/fillup" element={<FillUpWizard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth/success" element={<OAuthSuccess />} />


        {/* App Pages with Sidebar Layout (Protected) */}
        <Route
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/chat" element={<Chat/>} />
          <Route path="/quiz" element={<TakeQuiz />} />
          <Route path="/quiz-results" element={<QuizResults />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;