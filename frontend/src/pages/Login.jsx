import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InputField from "../components/ui/InputField";
import Button from "../components/ui/Button";
import { AlertMessage } from "../components/ui/Feedback";
import AuthSplitLayout from "../components/layout/AuthSplitLayout";
import loginPhoto from "../assets/login-photo.png";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const successMessage = location.state?.message;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Invalid credentials. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Welcome back"
      subtitle="Sign in to continue planning focused study sessions and stay on top of upcoming exams."
      mediaTitle="Study with consistency"
      mediaDescription="Build momentum with structured planning, clear priorities, and a streamlined workspace designed for productive revision cycles."
      imageSrc={loginPhoto}
      footer={(
        <p className="text-sm text-ss-neutral-300">
          Do not have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-ss-highlight transition-colors hover:text-ss-accent-soft"
          >
            Create one
          </Link>
        </p>
      )}
    >
        {successMessage && (
          <div className="mb-4">
            <AlertMessage variant="success">
              {successMessage}
            </AlertMessage>
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
