
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
              <Button
                onClick={() => navigate('/courses')}
                className="bg-black text-white hover:bg-gray-800 border-2 border-black"
              >
                Browse Courses
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  className="bg-white text-black border-2 border-black hover:bg-gray-100"
                >
                  Admin Panel
                </Button>
              )}
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
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
              Ready to continue your learning journey?
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => navigate('/courses')}
                className="bg-black text-white hover:bg-gray-800 border-2 border-black px-8 py-3 text-lg"
              >
                Browse Courses
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="bg-white text-black border-2 border-black hover:bg-gray-100 px-8 py-3 text-lg"
              >
                Dashboard
              </Button>
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
          Discover and access premium courses with instructor approval.
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
            <h3 className="text-xl font-bold text-black mb-4">For Students</h3>
            <p className="text-black">
              Browse available courses, request access, and learn from expert instructors.
            </p>
          </div>
          <div className="border-2 border-black p-6">
            <h3 className="text-xl font-bold text-black mb-4">For Instructors</h3>
            <p className="text-black">
              Create courses, manage student access, and track learning progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
