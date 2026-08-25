// frontend/src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
    const { register } = useAuth();
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
            await register(email, password);
            navigate('/');
        } catch (err) {
            let message;
            if (err.status === 409) {
                message = 'An account with that email already exists.';
            } else {
                message = err.message || 'Registration failed';
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
                <h1>Register</h1>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div className="form-field">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>
                <button type="submit" disabled={submitting}>
                    {submitting ? 'Creating account...' : 'Register'}
                </button>
                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
}