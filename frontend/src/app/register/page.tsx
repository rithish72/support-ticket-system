"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { homeFor, useAuth } from "@/components/providers/AuthProvider";
import { Alert, Spinner, btnPrimary, inputClass, labelClass } from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) router.replace(homeFor(user.role));
  }, [authLoading, user, router]);

  // Same rules the API enforces, shown live so nobody learns them from an error.
  const rules = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Contains a letter", ok: /[A-Za-z]/.test(password) },
    { label: "Contains a number", ok: /\d/.test(password) },
  ];
  const passwordValid = rules.every((r) => r.ok);
  const matches = password === confirm;
  const canSubmit = name.trim().length >= 2 && email && passwordValid && matches && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      const me = await register(name.trim(), email.trim(), password);
      router.replace(homeFor(me.role));
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't create your account. Please try again."));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="It takes a minute, and you can start raising tickets right away.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className={labelClass}>Full name</label>
          <input id="name" type="text" autoComplete="name" required minLength={2} maxLength={50} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
        </div>

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
              autoComplete="new-password"
              required
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-11`}
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-slate-700">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <ul className="mt-2 space-y-1">
            {rules.map((r) => (
              <li key={r.label} className={`flex items-center gap-2 text-xs ${r.ok ? "text-emerald-700" : "text-slate-500"}`}>
                <Check size={13} className={r.ok ? "opacity-100" : "opacity-30"} /> {r.label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label htmlFor="confirm" className={labelClass}>Confirm password</label>
          <input id="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} aria-invalid={confirm.length > 0 && !matches} />
          {confirm.length > 0 && !matches && <p className="mt-1.5 text-xs text-red-600">Passwords don't match.</p>}
        </div>

        {error && <Alert>{error}</Alert>}

        <button type="submit" disabled={!canSubmit} className={`${btnPrimary} w-full py-3`}>
          {submitting && <Spinner />}
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-teal-700 underline-offset-2 hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
