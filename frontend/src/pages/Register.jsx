import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';
import { ERROR_KIND, formatApiError, normalizeFieldErrors } from '../utils/formatApiError';
import './Auth.css';

const FIELD_LABELS = {
  username: 'Username',
  email: 'Email',
  first_name: 'First name',
  last_name: 'Last name',
  password: 'Password',
  password2: 'Confirm password',
};

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
  });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setBanner(null);
    setLoading(true);

    if (formData.password !== formData.password2) {
      setBanner({
        kind: ERROR_KIND.VALIDATION,
        summary: 'Passwords do not match',
        message:
          'The password and confirmation must be identical. Re-enter them and try again.',
      });
      setErrors({
        password2: 'Must match the password field above.',
      });
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      const fields = err.response?.data ? normalizeFieldErrors(err.response.data) : {};
      setErrors(fields);

      if (!err.response) {
        setBanner(formatApiError(err));
        return;
      }

      const base = formatApiError(err, {
        fallbackMessage: 'Registration failed. Please review the form and try again.',
      });

      if (Object.keys(fields).length > 0) {
        setBanner({
          kind: ERROR_KIND.VALIDATION,
          summary: 'Signup could not be completed',
          message: `${base.message} Check the fields below for details.`,
        });
      } else {
        setBanner(base);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Sign up to get started with StudySmart</p>

        {banner && (
          <ErrorBanner
            kind={banner.kind}
            summary={banner.summary}
            message={banner.message}
          />
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                placeholder="First name"
                autoComplete="given-name"
              />
              {errors.first_name && (
                <span className="field-error">
                  <span className="field-error-label">{FIELD_LABELS.first_name}: </span>
                  {errors.first_name}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                placeholder="Last name"
                autoComplete="family-name"
              />
              {errors.last_name && (
                <span className="field-error">
                  <span className="field-error-label">{FIELD_LABELS.last_name}: </span>
                  {errors.last_name}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
              autoComplete="username"
            />
            {errors.username && (
              <span className="field-error">
                <span className="field-error-label">{FIELD_LABELS.username}: </span>
                {errors.username}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
              autoComplete="email"
            />
            {errors.email && (
              <span className="field-error">
                <span className="field-error-label">{FIELD_LABELS.email}: </span>
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a password"
              autoComplete="new-password"
            />
            {errors.password && (
              <span className="field-error">
                <span className="field-error-label">{FIELD_LABELS.password}: </span>
                {errors.password}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password2">Confirm Password</label>
            <input
              type="password"
              id="password2"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            {errors.password2 && (
              <span className="field-error">
                <span className="field-error-label">{FIELD_LABELS.password2}: </span>
                {errors.password2}
              </span>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
