// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
    const { login } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            let message;
            if (err.status === 429) {
                message = 'Too many attempts. Please wait a few minutes and try again.';
            } else {
                message = err.message || 'Login failed';
            }
            setError(message);
            showToast(message, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    return (

        <div className="legacy-page-frame">
            <form onSubmit={handleSubmit}>
                <h1>Login</h1>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div className="form-field">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={submitting}>
                    {submitting ? 'Logging in...' : 'Login'}
                </button>
                <p>
                    No account? <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    );
}