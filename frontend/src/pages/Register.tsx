import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { getGreeting } from '../lib/greeting';

export default function Register() {
    const { register } = useAuth() as any;
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await register(email, password);
            navigate('/');
        } catch (err: any) {
            let message;
            if (err.status === 409) {
                message = 'An account with that email already exists.';
            } else {
                message = err.message || 'Registration failed';
            }
            showToast(message, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    const greeting = getGreeting();

    return (
        <div className="min-h-[100svh] flex flex-col items-center justify-center p-6 bg-paper">
            <div className="w-full max-w-sm text-center mb-10">
                <h1 className="font-display text-display text-ink mb-2">
                    {greeting}.
                </h1>
                <p className="text-body text-muted">
                    A quiet place for your bookmarks.
                </p>
            </div>

            <div className="w-full max-w-sm bg-surface border border-line rounded-lg shadow-sm p-8">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Input
                        id="email"
                        type="email"
                        label="Email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        id="password"
                        type="password"
                        label="Password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    <div className="pt-2">
                        <Button type="submit" variant="primary" disabled={submitting} className="w-full justify-center">
                            {submitting ? 'Creating account...' : 'Register'}
                        </Button>
                    </div>
                </form>
            </div>

            <p className="mt-8 text-small text-muted">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-ink hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm px-1">
                    Log in
                </Link>
            </p>
        </div>
    );
}
