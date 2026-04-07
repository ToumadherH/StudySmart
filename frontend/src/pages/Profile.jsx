import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import "./Profile.css";

const Profile = () => {
  const { user: authUser, setUser } = useAuth?.() || {};
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await userService.getProfile();
        setFormData({
          username: data.username || "",
          email: data.email || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
        });
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await userService.updateProfile(formData);
      setFormData({
        username: updated.username || "",
        email: updated.email || "",
        first_name: updated.first_name || "",
        last_name: updated.last_name || "",
      });

      // Keep auth context/localStorage in sync if available
      if (authUser && setUser) {
        const newUser = { ...authUser, ...updated };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
      }

      setSuccess("Profile updated successfully");
    } catch (err) {
      console.error("Failed to update profile", err);
      const backendErrors = err.response?.data;
      if (backendErrors && typeof backendErrors === "object") {
        const firstKey = Object.keys(backendErrors)[0];
        const firstMsg =
          Array.isArray(backendErrors[firstKey])
            ? backendErrors[firstKey][0]
            : backendErrors[firstKey];
        setError(`${firstKey}: ${firstMsg}`);
      } else {
        setError("Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>Your Profile</h1>
        <p className="profile-subtitle">
          View and update your account information.
        </p>

        {error && <div className="profile-alert error">{error}</div>}
        {success && <div className="profile-alert success">{success}</div>}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              disabled
            />
            <small className="field-help">Username cannot be changed.</small>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First name</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last name</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
