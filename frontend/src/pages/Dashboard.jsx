import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h2>StudySmart</h2>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </nav>
      <div className="dashboard-content">
        <h1>Welcome, {user?.first_name}!</h1>
        <p>You're successfully logged into StudySmart.</p>
        <div className="user-info">
          <h3>Your Profile</h3>
          <p><strong>Username:</strong> {user?.username}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
