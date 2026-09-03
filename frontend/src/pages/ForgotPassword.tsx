import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { usePageTitle } from '../lib/usePageTitle';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../api/client';
import { getErrorStatus } from '../lib/errors';
import { Mail, CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  previewUrl?: string;
  resetUrl?: string;
}

export default function ForgotPassword() {
  usePageTitle('Forgot Password');

  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devLinks, setDevLinks] = useState<{ previewUrl?: string; resetUrl?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    try {
      const res = await apiClient.post<ForgotPasswordResponse>('/api/auth/forgot-password', { email });
      setSubmitted(true);
      if (res.previewUrl || res.resetUrl) {
        setDevLinks({ previewUrl: res.previewUrl, resetUrl: res.resetUrl });
      }
      showToast('Password reset instructions sent.', 'success');
    } catch (err: unknown) {
      if (getErrorStatus(err) === 429) {
        showToast('Too many requests. Please wait a few minutes before trying again.', 'error');
      } else {
        const message = err instanceof Error ? err.message : 'Failed to request password reset';
        showToast(message, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center p-6 bg-paper">
      <div className="w-full max-w-sm text-center mb-10">
        <h1 className="font-display text-display text-ink mb-2">
          Reset password.
        </h1>
        <p className="text-body text-muted">
          Enter your email to receive a password reset link.
        </p>
      </div>

      <div className="w-full max-w-sm bg-surface border border-line rounded-lg shadow-sm p-8">
        {submitted ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-body font-semibold text-ink mb-1">Check your email</h2>
              <p className="text-small text-muted leading-relaxed">
                If an account exists for <span className="text-ink font-medium">{email}</span>, we have sent instructions to reset your password.
              </p>
            </div>

            {devLinks && (
              <div className="w-full mt-2 p-3 bg-paper border border-line rounded text-left text-tiny space-y-2">
                <span className="font-semibold text-ink block">🛠️ Local Dev Quick Access:</span>
                {devLinks.previewUrl && (
                  <a
                    href={devLinks.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-accent hover:underline break-all"
                  >
                    <span>View Email in Ethereal</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}
                {devLinks.resetUrl && (
                  <Link
                    to={new URL(devLinks.resetUrl).pathname}
                    className="flex items-center gap-1.5 text-accent hover:underline break-all"
                  >
                    <span>Direct Reset Password Page</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </Link>
                )}
              </div>
            )}

            <div className="w-full pt-4 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  setSubmitted(false);
                  setDevLinks(null);
                }}
              >
                Send another link
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              leadingIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              className="w-full justify-center"
            >
              Send reset link
            </Button>
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
