import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/authService";
import InputField from "../components/ui/InputField";
import Button from "../components/ui/Button";
import { AlertMessage } from "../components/ui/Feedback";
import AuthSplitLayout from "../components/layout/AuthSplitLayout";
import loginPhoto from "../assets/login-photo.png";

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
      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2,
      });
      navigate("/login", {
        state: { message: "Registration successful! Please log in." },
      });
    } catch (err) {
      console.error("Registration error:", err);
      const data = err.response?.data;
      if (data) {
        const errors = {};
        if (data.username) errors.username = data.username[0];
        if (data.email) errors.email = data.email[0];
        if (data.password) errors.password = data.password[0];
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
    <AuthSplitLayout
      title="Create your account"
      subtitle="Set up a focused study workspace with subject tracking, planning, and calendar visibility in one place."
      mediaTitle="Plan each week with clarity"
      mediaDescription="Organize subjects by priority, generate balanced sessions, and keep exam preparation structured from day one."
      imageSrc={loginPhoto}
      footer={(
        <p className="text-sm text-ss-neutral-300">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-ss-highlight transition-colors hover:text-ss-accent-soft"
          >
            Sign in
          </Link>
        </p>
      )}
    >

        {error && (
          <div className="mb-4">
            <AlertMessage variant="error">{error}</AlertMessage>
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
            placeholder="Choose a username"
            autoComplete="username"
            hint="Use at least 3 characters."
            error={fieldErrors.username}
          />

          <InputField
            type="email"
            id="email"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            autoComplete="email"
            error={fieldErrors.email}
          />

          <InputField
            type="password"
            id="password"
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Create a password"
            autoComplete="new-password"
            minLength={8}
            hint="Use at least 8 characters."
            error={fieldErrors.password}
          />

          <InputField
            type="password"
            id="password2"
            label="Confirm Password"
            name="password2"
            value={formData.password2}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
            autoComplete="new-password"
            error={
              formData.password2 && formData.password !== formData.password2
                ? "Passwords do not match"
                : ""
            }
          />

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
    </AuthSplitLayout>
  );
};

export default Register;
