import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>Welcome to StudySmart</h1>
        <p className="welcome-message">
          Hello, <strong>{user?.username || 'User'}</strong>!
        </p>
        <p className="home-description">
          You are successfully logged in. This is a protected route.
        </p>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Home;
