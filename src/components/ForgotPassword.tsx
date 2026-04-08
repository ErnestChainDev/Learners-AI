import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import AuthLayout from "./AuthLayout";
import { authApi } from "../api/auth";
import sendingEmail from "../assets/Send Email.gif";

function getErrMsg(err: unknown, fallback: string) {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return fallback;
}

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
        // ✅ backend expects: { email }
        await authApi.forgotPassword({ email: email.trim() });

        // ✅ always show success (backend should be "safe response" anyway)
        setSuccess(true);
        } catch (err) {
        setError(getErrMsg(err, "Failed to send reset email"));
        } finally {
        setLoading(false);
        }
    };

    if (success) {
        return (
        <AuthLayout title="Check Your Email" subtitle="We've sent you a password reset link">
            <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-600" />
            </div>

            <p className="text-gray-700">
                If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
            </p>

            <button onClick={() => navigate("/login")} className="btn-primary">
                Back to Login
            </button>
            </div>
        </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Forgot Password" subtitle="Enter your email to receive a reset link">
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
            )}

            {/* Email Field */}
            <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
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
                disabled={loading}
                autoComplete="email"
                />
            </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading || !email.trim()} className="primary-btn flex items-center justify-center">
            {loading ? (
                <img
                src={sendingEmail}
                alt="Sending..."
                className="w-18 h-18 object-contain"
                draggable={false}
                />
            ) : (
                "Send Reset Link"
            )}
            </button>

            {/* Back to Login */}
            <button type="button" onClick={() => navigate("/login")} className="btn-secondary">
            <ArrowLeft className="w-5 h-5" />
            Back to Login
            </button>
        </form>
        </AuthLayout>
    );
};

export default ForgotPassword;