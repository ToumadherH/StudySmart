import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Home = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card elevated className="w-full max-w-lg !p-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ss-highlight">Welcome to StudySmart</h1>
        <p className="mt-4 text-base text-ss-neutral-300">
          Hello, <strong className="text-ss-neutral-100">{user?.username || 'User'}</strong>!
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ss-muted">
          You are successfully logged in. This is a protected route.
        </p>
        <Button onClick={handleLogout} className="mt-6">
          Logout
        </Button>
      </Card>
    </div>
  );
};

export default Home;
