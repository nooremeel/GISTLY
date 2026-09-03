import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { usePageTitle } from '../lib/usePageTitle';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../api/client';
import { Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  usePageTitle('Reset Password');

  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if token is missing
  if (!token) {
    return (
      <div className="min-h-[100svh] flex flex-col items-center justify-center p-6 bg-paper">
        <div className="w-full max-w-sm bg-surface border border-line rounded-lg shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-coral/10 text-coral flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-body font-semibold text-ink mb-2">Invalid Reset Link</h1>
          <p className="text-small text-muted mb-6">
            This password reset link is missing a valid token or has expired.
          </p>
          <Button
            type="button"
            variant="primary"
            className="w-full justify-center"
            onClick={() => navigate('/forgot-password')}
          >
            Request a new link
          </Button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/api/auth/reset-password/${token}`, { password });
      setIsSuccess(true);
      showToast('Password reset successfully! Please log in.', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setErrorMsg(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center p-6 bg-paper">
      <div className="w-full max-w-sm text-center mb-10">
        <h1 className="font-display text-display text-ink mb-2">
          New password.
        </h1>
        <p className="text-body text-muted">
          Choose a secure password for your account.
        </p>
      </div>

      <div className="w-full max-w-sm bg-surface border border-line rounded-lg shadow-sm p-8">
        {isSuccess ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-body font-semibold text-ink mb-1">Password Updated</h2>
              <p className="text-small text-muted">
                Your password has been changed successfully. Redirecting to log in...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              id="password"
              type="password"
              label="New Password"
              placeholder="At least 6 characters"
              leadingIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              required
              minLength={6}
              autoFocus
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Confirm New Password"
              placeholder="Re-type your password"
              leadingIcon={<Lock className="w-4 h-4" />}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              error={errorMsg || undefined}
              required
              minLength={6}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                className="w-full justify-center"
              >
                Reset password
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-small text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm px-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to log in</span>
        </Link>
      </div>
    </div>
  );
}
