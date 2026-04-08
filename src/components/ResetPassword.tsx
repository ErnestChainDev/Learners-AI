import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, EyeOff, Eye, CheckCircle } from "lucide-react";
import AuthLayout from "./AuthLayout";
import { authApi } from "../api/auth";

function getErrMsg(err: unknown, fallback: string) {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return fallback;
}

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const email = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
    const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const linkInvalid = !email || !token;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (linkInvalid) {
        setError("Invalid reset link. Please request a new one.");
        return;
        }

        if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
        }

        // ✅ backend schema: min_length=8
        if (password.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
        }

        setLoading(true);
        try {
        await authApi.resetPassword({
            email,
            token,
            new_password: password, // ✅ snake_case matches backend
        });
        setSuccess(true);
        } catch (err) {
        setError(getErrMsg(err, "Failed to reset password"));
        } finally {
        setLoading(false);
        }
    };

    if (success) {
        return (
        <AuthLayout title="Password Reset Successful" subtitle="Your password has been changed">
            <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <p className="text-gray-700">You can now log in with your new password.</p>

            <button onClick={() => navigate("/login")} className="btn-primary">
                Go to Login
            </button>
            </div>
        </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Reset Password" subtitle="Enter your new password">
        <form onSubmit={handleSubmit} className="space-y-5">
            {(error || linkInvalid) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error || "Invalid reset link. Please request a new one."}
            </div>
            )}

            {/* Email Display */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-700">{email || "Missing email"}</div>
            </div>

            {/* New Password */}
            <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
            </label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={8}
                className="input-field"
                disabled={loading || linkInvalid}
                autoComplete="new-password"
                />
                <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>
            </div>

            {/* Confirm Password */}
            <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
            </label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={8}
                className="input-field"
                disabled={loading || linkInvalid}
                autoComplete="new-password"
                />
                <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || linkInvalid} className="btn-primary">
            {loading ? "Resetting..." : "Reset Password"}
            </button>

            {/* Back to Login */}
            <div className="text-center text-sm text-gray-700">
            Remember your password?{" "}
            <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary hover:text-primary-dark font-semibold transition-colors"
            >
                Back to Login
            </button>
            </div>
        </form>
        </AuthLayout>
    );
};

export default ResetPassword;