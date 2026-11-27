"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { homeFor, useAuth } from "@/components/providers/AuthProvider";
import { Alert, Spinner, btnPrimary, inputClass, labelClass } from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Already signed in? Skip the form.
  useEffect(() => {
    if (!authLoading && user) router.replace(homeFor(user.role));
  }, [authLoading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const me = await login(email.trim(), password);
      router.replace(homeFor(me.role)); // admins land on the admin area, everyone else on their dashboard
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't sign you in. Check your email and password."));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Use your SupportDesk account to view and manage tickets.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
        <div>
          <label htmlFor="email" className={labelClass}>Email address</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-slate-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <Alert>{error}</Alert>}

        <button type="submit" disabled={submitting || !email || !password} className={`${btnPrimary} w-full py-3`}>
          {submitting && <Spinner />}
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        New to SupportDesk?{" "}
        <Link href="/register" className="font-medium text-teal-700 underline-offset-2 hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
