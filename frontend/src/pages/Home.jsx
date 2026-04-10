import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-8">
      <Card elevated className="w-full max-w-2xl p-8 text-center sm:p-10">
        <h1 className="text-3xl font-bold text-ss-highlight sm:text-4xl">Welcome to StudySmart</h1>
        <p className="mt-4 text-sm text-ss-muted">
          Hello, <span className="font-semibold text-ss-text">{user?.username || "User"}</span>. Your workspace is ready.
        </p>
        <p className="mt-2 text-sm text-ss-muted">
          Continue with subjects, planning, and calendar views to organize your next exam cycle.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="primary" onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
          <Button variant="secondary" onClick={handleLogout}>Sign out</Button>
        </div>
      </Card>
    </div>
  );
};

export default Home;
