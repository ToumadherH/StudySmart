import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const location = useLocation();
  const { login } = useAuth();

  const successMessage = location.state?.message;

  const successMessage = location.state?.message;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.detail ||
                      err.response?.data?.error ||
                      'Invalid credentials. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to continue to StudySmart</p>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {error && (
          <div className="mb-4">
            <AlertMessage variant="error">
              {error}
            </AlertMessage>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <InputField
            type="text"
            id="username"
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Enter your username"
            autoComplete="username"
            hint="Use the username you created during registration."
          />

          <InputField
            type="password"
            id="password"
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
    </AuthSplitLayout>
  );
};

export default Login;
