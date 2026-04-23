import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, EyeOff, Eye } from "lucide-react";
import AuthLayout from "./AuthLayout";
import { authApi } from "../api/auth";
import { profileApi } from "../api/profile";
import { storage } from "../utils/storage";
import "../styles/AuthForm.css";

type LoginLocationState = {
    email?: string;
    justRegistered?: boolean;
};

function getLocationState(state: unknown): LoginLocationState {
    if (!state || typeof state !== "object") return {};
    const s = state as Record<string, unknown>;
    return {
        email: typeof s.email === "string" ? s.email : undefined,
        justRegistered:
        typeof s.justRegistered === "boolean" ? s.justRegistered : undefined,
    };
}

function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;

    if (typeof err === "object" && err !== null) {
        if (
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
        ) {
        return (err as { message: string }).message;
        }
        if (
        "detail" in err &&
        typeof (err as { detail?: unknown }).detail === "string"
        ) {
        return (err as { detail: string }).detail;
        }
    }

    return "Login failed";
}

function safeReturnTo(v: unknown) {
    const s = typeof v === "string" ? v : "";
    if (!s) return "/home";
    if (!s.startsWith("/")) return "/home";
    if (s.startsWith("//")) return "/home";
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
const API_ORIGIN = API_BASE ? new URL(API_BASE).origin : window.location.origin;

type OAuthMessage = { token?: string; return_to?: string };

// Google Logo SVG Component
const GoogleLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="20"
        height="20"
    >
        <path
        fill="#EA4335"
        d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.08-6.08C34.42 3.09 29.5 1 24 1 14.82 1 7.01 6.48 3.52 14.23l7.08 5.5C12.3 13.64 17.69 9.5 24 9.5z"
        />
        <path
        fill="#4285F4"
        d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9.01h12.7c-.55 2.95-2.2 5.45-4.68 7.13l7.18 5.57C43.44 37.64 46.52 31.5 46.52 24.5z"
        />
        <path
        fill="#FBBC05"
        d="M10.6 28.27A14.6 14.6 0 0 1 9.5 24c0-1.49.26-2.93.71-4.27l-7.08-5.5A23.93 23.93 0 0 0 0 24c0 3.87.92 7.53 2.52 10.76l8.08-6.49z"
        />
        <path
        fill="#34A853"
        d="M24 47c6.48 0 11.93-2.15 15.9-5.84l-7.18-5.57C30.6 37.45 27.46 38.5 24 38.5c-6.3 0-11.68-4.13-13.4-9.73l-8.08 6.49C6.99 41.5 14.81 47 24 47z"
        />
    </svg>
);

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const popupRef = useRef<Window | null>(null);
    const oauthTimeoutRef = useRef<number | null>(null);
    const pollRef = useRef<number | null>(null);

    const errorRef = useRef("");

    useEffect(() => {
        document.title = "Login - Learner's Portal";
    }, []);

    useEffect(() => {
        errorRef.current = error;
    }, [error]);

    useEffect(() => {
        const { email: prefillEmail, justRegistered } = getLocationState(location.state);
        if (prefillEmail) setEmail(prefillEmail);
        if (justRegistered) setNotice("Account created! You're now ready to log in.");
        window.history.replaceState({}, document.title);
    }, [location.state]);

    useEffect(() => {
        const onMessage = async (ev: MessageEvent) => {
        if (ev.origin !== API_ORIGIN && ev.origin !== FRONTEND_ORIGIN) return;

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading || oauthLoading) return;

        setError("");
        setLoading(true);

        try {
        const res = await authApi.login({ email: email.trim(), password });
        if (!res?.access_token) throw new Error("No access token received.");

        storage.setToken(res.access_token);
        storage.setUser(res.user);
        storage.setProfile(res.profile);

        navigate("/home", { replace: true });
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

        const returnTo = "/home";
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
        <AuthLayout title="Login" subtitle="Welcome back! Please login to your account">
        <form onSubmit={handleSubmit} className="space-y-5">

            {/* NOTICE */}
            {notice && (
            <div className="border-2 border-[#1E293B] bg-[#34D399] text-white px-4 py-3 rounded-lg shadow-[4px_4px_0px_#1E293B] text-sm">
                {notice}
            </div>
            )}

            {/* ERROR */}
            {error && (
            <div className="border-2 border-[#1E293B] bg-[#F472B6] text-white px-4 py-3 rounded-lg shadow-[4px_4px_0px_#1E293B] text-sm">
                {error}
            </div>
            )}

            {/* EMAIL */}
            <div>
            <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wide text-[#1E293B] mb-2"
            >
                Email
            </label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isBusy}
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#CBD5E1] bg-white focus:border-[#8B5CF6] focus:shadow-[4px_4px_0px_#8B5CF6] outline-none transition"
                />
            </div>
            </div>

            {/* PASSWORD */}
            <div>
            <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wide text-[#1E293B] mb-2"
            >
                Password
            </label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={8}
                disabled={isBusy}
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 rounded-lg border-2 border-[#CBD5E1] bg-white focus:border-[#8B5CF6] focus:shadow-[4px_4px_0px_#8B5CF6] outline-none transition"
                />
                <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isBusy}
                >
                {showPassword ? <EyeOff className="w-5 h-5 text-[#64748B]" /> : <Eye className="w-5 h-5 text-[#64748B]" />}
                </button>
            </div>
            </div>

            {/* SUBMIT */}
            <button
            type="submit"
            disabled={isBusy}
            className="w-full bg-[#8B5CF6] text-white font-bold py-3 rounded-full border-2 border-[#1E293B] shadow-[4px_4px_0px_#1E293B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1E293B] active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0px_#1E293B]"
            >
            {loading ? "Logging in..." : "Continue"}
            </button>

            {/* GOOGLE */}
            <button
            type="button"
            onClick={handleGoogle}
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-3 border-2 border-[#1E293B] rounded-full py-3 font-semibold transition hover:bg-[#FBBF24]"
            >
            {oauthLoading ? (
                "Signing in with Google..."
            ) : (
                <>
                <GoogleLogo />
                Continue with Google
                </>
            )}
            </button>

            {/* LINK */}
            <div className="text-center text-sm text-[#1E293B]">
            Don&apos;t have an account?{" "}
            <button
                type="button"
                onClick={() => navigate("/register")}
                className="font-bold text-[#8B5CF6]"
                disabled={isBusy}
            >
                Sign up
            </button>
            </div>
        </form>

        {/* MODAL */}
        {oauthLoading && (
            <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            role="dialog"
            aria-modal="true"
            >
            <div className="w-[92%] max-w-sm bg-white border-2 border-[#1E293B] rounded-xl p-5 shadow-[6px_6px_0px_#1E293B]">
                <div className="text-lg font-bold text-[#1E293B]">Signing in…</div>
                <div className="mt-2 text-sm text-[#64748B]">
                A Google window opened. Please finish sign-in there.
                </div>
                <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    className="border-2 border-[#1E293B] rounded-full px-4 py-2 hover:bg-[#FBBF24]"
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

export default Login;