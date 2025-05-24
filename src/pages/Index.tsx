
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="border-b-2 border-black p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-black">Mentify Course</h1>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Button
                  onClick={() => navigate('/admin')}
                  className="bg-black text-white hover:bg-gray-800 border-2 border-black"
                >
                  Admin Panel
                </Button>
              )}
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-white text-black border-2 border-black hover:bg-gray-100"
              >
                Dashboard
              </Button>
              <Button
                onClick={signOut}
                variant="outline"
                className="bg-white text-black border-2 border-black hover:bg-gray-100"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-2xl mx-auto p-8">
            <h1 className="text-6xl font-bold mb-6 text-black">Welcome Back</h1>
            <p className="text-xl text-black mb-8">
              You're successfully logged in to Mentify Course platform.
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-black text-white hover:bg-gray-800 border-2 border-black px-8 py-3 text-lg"
              >
                Go to Dashboard
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  className="bg-white text-black border-2 border-black hover:bg-gray-100 px-8 py-3 text-lg"
                >
                  Admin Panel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto p-8">
        <h1 className="text-6xl font-bold mb-6 text-black">Mentify Course</h1>
        <p className="text-xl text-black mb-8">
          A simple and elegant authentication system with admin capabilities.
        </p>
        <div className="space-x-4">
          <Button
            onClick={() => navigate('/auth')}
            className="bg-black text-white hover:bg-gray-800 border-2 border-black px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border-2 border-black p-6">
            <h3 className="text-xl font-bold text-black mb-4">For Users</h3>
            <p className="text-black">
              Simple sign-up and login process with secure authentication.
            </p>
          </div>
          <div className="border-2 border-black p-6">
            <h3 className="text-xl font-bold text-black mb-4">For Admins</h3>
            <p className="text-black">
              Complete user management system with role-based access control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
