import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, EyeOff, Eye } from "lucide-react";
import AuthLayout from "./AuthLayout";
import { authApi } from "../api/auth";
import { profileApi } from "../api/profile";
import { storage } from "../utils/storage";
import "../styles/AuthForm.css";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;

  if (typeof err === "object" && err !== null) {
    if ("message" in err && typeof (err as { message?: unknown }).message === "string") {
      return (err as { message: string }).message;
    }
    if ("detail" in err && typeof (err as { detail?: unknown }).detail === "string") {
      return (err as { detail: string }).detail;
    }
  }
  return "Registration failed";
}

function safeReturnTo(v: unknown) {
  const s = typeof v === "string" ? v : "";
  if (!s) return "/fillup";
  if (!s.startsWith("/")) return "/fillup";
  if (s.startsWith("//")) return "/fillup";
  return s;
}

function safeClosePopup(popupRef: React.MutableRefObject<Window | null>) {
  const w = popupRef.current;
  if (!w) return;
  try {
    w.close();
  } catch (e) {
    console.debug("Popup close blocked:", e);
  } finally {
    popupRef.current = null;
  }
}

const FRONTEND_ORIGIN = (import.meta.env.VITE_FRONTEND_ORIGIN || window.location.origin).replace(/\/$/, "");
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

type OAuthMessage = { token?: string; return_to?: string };

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState("");

  const popupRef = useRef<Window | null>(null);
  const oauthTimeoutRef = useRef<number | null>(null);
  const pollRef = useRef<number | null>(null);

  const errorRef = useRef("");

  useEffect(() => {
    document.title = "Register - Learner's Portal";
  }, []);

  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  useEffect(() => {
    const onMessage = async (ev: MessageEvent) => {
      if (ev.origin !== API_BASE && ev.origin !== FRONTEND_ORIGIN) return;

      const data = (ev.data || {}) as OAuthMessage;
      const token = typeof data.token === "string" ? data.token : "";
      if (!token) return;

      try {
        setError("");
        setOauthLoading(true);

        if (oauthTimeoutRef.current) window.clearTimeout(oauthTimeoutRef.current);
        oauthTimeoutRef.current = null;

        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;

        safeClosePopup(popupRef);

        storage.clearAll();
        storage.setToken(token);

        const verify = await authApi.verify(token);
        const profile = await profileApi.me();

        storage.setUser({ id: Number(verify.sub), email: verify.email });
        storage.setProfile(profile);

        const returnTo = safeReturnTo(data.return_to);
        navigate(returnTo, { replace: true });
      } catch (err) {
        setError(getErrorMessage(err) || "Google sign-in failed");
      } finally {
        setOauthLoading(false);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (oauthTimeoutRef.current) window.clearTimeout(oauthTimeoutRef.current);
      if (pollRef.current) window.clearInterval(pollRef.current);
      safeClosePopup(popupRef);
    };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || oauthLoading) return;

    setError("");
    setLoading(true);

    try {
      const res = await authApi.register({ email: email.trim(), password });

      storage.setToken(res.access_token);
      storage.setUser(res.user);
      storage.setProfile(res.profile);

      navigate("/fillup", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    if (loading || oauthLoading) return;

    setError("");
    setOauthLoading(true);

    const returnTo = "/fillup";
    const url = `${API_BASE}/auth/google/login?mode=popup&return_to=${encodeURIComponent(returnTo)}`;

    const w = 520;
    const h = 650;
    const top = Math.max(0, (window.outerHeight - h) / 2 + window.screenY);
    const left = Math.max(0, (window.outerWidth - w) / 2 + window.screenX);

    const popup = window.open(
      url,
      "google_oauth",
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      setOauthLoading(false);
      setError("Popup blocked. Please allow popups and try again.");
      return;
    }

    popupRef.current = popup;

    oauthTimeoutRef.current = window.setTimeout(() => {
      setOauthLoading(false);
      setError("Google sign-in timed out. Please try again.");

      safeClosePopup(popupRef);

      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    }, 120_000);

    pollRef.current = window.setInterval(() => {
      if (!popupRef.current || popupRef.current.closed) {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;

        if (oauthTimeoutRef.current) window.clearTimeout(oauthTimeoutRef.current);
        oauthTimeoutRef.current = null;

        if (!errorRef.current) setError("Google sign-in was cancelled.");
        setOauthLoading(false);
        popupRef.current = null;
      }
    }, 400);
  };

  const isBusy = loading || oauthLoading;

  return (
    <AuthLayout title="Register" subtitle="Sign up to start learning new skills">
      <form onSubmit={handleRegister} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="input-field"
              disabled={isBusy}
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={8}
              className="input-field"
              disabled={isBusy}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isBusy}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">At least 8 characters.</p>
        </div>

        <button type="submit" disabled={isBusy} className="primary-btn">
          {loading ? "Creating account..." : "Continue"}
        </button>

        <button type="button" onClick={handleGoogle} disabled={isBusy} className="btn-secondary">
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {oauthLoading ? "Signing in with Google..." : "Continue with Google"}
        </button>

        <div className="text-center text-sm text-gray-700">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            disabled={isBusy}
          >
            Sign in
          </button>
        </div>
      </form>

      {oauthLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true">
          <div className="w-[92%] max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="text-lg font-semibold text-gray-900">Signing in…</div>
            <div className="mt-2 text-sm text-gray-600">A Google window opened. Please finish sign-in there.</div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setOauthLoading(false);
                  setError("Google sign-in was cancelled.");

                  if (oauthTimeoutRef.current) window.clearTimeout(oauthTimeoutRef.current);
                  oauthTimeoutRef.current = null;

                  if (pollRef.current) window.clearInterval(pollRef.current);
                  pollRef.current = null;

                  safeClosePopup(popupRef);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default Register;