import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storage } from "../utils/storage";
import { profileApi } from "../api/profile";
import { authApi } from "../api/auth";

function getErrorMessage(err: unknown, fallback: string): string {
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
  return fallback;
}

function safeReturnTo(v: string | null) {
  if (!v) return "/home";
  if (!v.startsWith("/")) return "/home";
  if (v.startsWith("//")) return "/home";
  return v;
}

function getOAuthParams() {
  const hash = window.location.hash.replace(/^#/, "");
  const hashParams = new URLSearchParams(hash);

  const url = new URL(window.location.href);
  const queryParams = url.searchParams;

  const token = hashParams.get("token") || queryParams.get("token");
  const return_to = hashParams.get("return_to") || queryParams.get("return_to");

  return { token, returnTo: safeReturnTo(return_to) };
}

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    // ✅ Prevent double-run in React 18 StrictMode (dev)
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const { token, returnTo } = getOAuthParams();

      // ✅ If token already stored (e.g. second run), just go
      const existing = storage.getToken?.() || "";
      if (!token && existing) {
        navigate(returnTo, { replace: true });
        return;
      }

      if (!token) {
        setError("Missing OAuth token");
        return;
      }

      try {
        storage.clearAll();
        storage.setToken(token);

        // ✅ remove token from URL AFTER storing it
        window.history.replaceState({}, document.title, "/oauth/success");

        const verify = await authApi.verify(token);
        const profile = await profileApi.me();

        storage.setUser({ id: Number(verify.sub), email: verify.email });
        storage.setProfile(profile);

        navigate(returnTo, { replace: true });
      } catch (err) {
        setError(getErrorMessage(err, "OAuth sign-in failed"));
      }
    };

    void run();
  }, [navigate]);

  return <div>{error || "Signing you in..."}</div>;
}