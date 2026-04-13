import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Auth.css";

const FIELD_LABELS = {
  username: "Username",
  email: "Email",
  password: "Password",
  password2: "Confirm password",
};

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (formData.password !== formData.password2) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register/", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2,
      });

      // Auto-login after registration
      if (response.data.access && response.data.refresh) {
        localStorage.setItem("accessToken", response.data.access);
        localStorage.setItem("refreshToken", response.data.refresh);
        login(response.data.user || {});
        navigate("/dashboard");
      } else {
        navigate("/login", {
          state: { message: "Registration successful! Please log in." },
        });
      }
    } catch (err) {
      console.error("Registration error:", err);
      const data = err.response?.data;
      if (data) {
        const errors = {};
        if (data.username)
          errors.username = Array.isArray(data.username)
            ? data.username[0]
            : data.username;
        if (data.email)
          errors.email = Array.isArray(data.email) ? data.email[0] : data.email;
        if (data.password)
          errors.password = Array.isArray(data.password)
            ? data.password[0]
            : data.password;
        if (data.password2)
          errors.password2 = Array.isArray(data.password2)
            ? data.password2[0]
            : data.password2;
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
        } else {
          setError(data.detail || "Registration failed. Please try again.");
        }
      } else {
        setError("Registration failed. Please try again.");
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

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
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
            {fieldErrors.username && (
              <span className="field-error">
                <span className="field-error-label">
                  {FIELD_LABELS.username}:{" "}
                </span>
                {fieldErrors.username}
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
            {fieldErrors.email && (
              <span className="field-error">
                <span className="field-error-label">
                  {FIELD_LABELS.email}:{" "}
                </span>
                {fieldErrors.email}
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
            {fieldErrors.password && (
              <span className="field-error">
                <span className="field-error-label">
                  {FIELD_LABELS.password}:{" "}
                </span>
                {fieldErrors.password}
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
            {fieldErrors.password2 && (
              <span className="field-error">
                <span className="field-error-label">
                  {FIELD_LABELS.password2}:{" "}
                </span>
                {fieldErrors.password2}
              </span>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
