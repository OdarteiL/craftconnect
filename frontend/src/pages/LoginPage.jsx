import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to login';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white">CC</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold font-heading text-white mb-2">CraftConnect</h1>
          <p className="text-gray-400">Welcome back to your creative marketplace</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-8 shadow-2xl">
          {error && (
            <div className="bg-red-500/15 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 text-sm flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-8 bg-gradient-to-r from-primary-100 to-accent text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary-100/50 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-100 hover:text-primary-80 font-semibold transition">
              Create one
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
