import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'buyer',
    phone: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white">CC</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold font-heading text-white mb-2">Join CraftConnect</h1>
          <p className="text-gray-400">Start your creative journey today</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-8 shadow-2xl">
          {error && (
            <div className="bg-red-500/15 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 text-sm flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">First Name *</label>
                <input 
                  type="text" 
                  name="first_name" 
                  required 
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 transition"
                  value={formData.first_name} 
                  onChange={handleChange}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Last Name *</label>
                <input 
                  type="text" 
                  name="last_name" 
                  required 
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 transition"
                  value={formData.last_name} 
                  onChange={handleChange}
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Email Address *</label>
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 transition"
                value={formData.email} 
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Password *</label>
              <input 
                type="password" 
                name="password" 
                required 
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 transition"
                value={formData.password} 
                onChange={handleChange}
                minLength={6}
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3">What's your role? *</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="cursor-pointer">
                  <input 
                    type="radio" 
                    name="role" 
                    value="buyer" 
                    checked={formData.role === 'buyer'} 
                    onChange={handleChange} 
                    className="sr-only peer"
                  />
                  <div className="p-4 rounded-lg border-2 border-gray-600 bg-gray-700/30 hover:border-primary-100/50 peer-checked:border-primary-100 peer-checked:bg-primary-100/10 text-center transition-all">
                    <span className="block text-2xl mb-2">🛍️</span>
                    <span className="block font-semibold text-gray-200">Buyer</span>
                    <span className="block text-xs text-gray-400 mt-1">Browse & purchase</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input 
                    type="radio" 
                    name="role" 
                    value="artisan" 
                    checked={formData.role === 'artisan'} 
                    onChange={handleChange} 
                    className="sr-only peer"
                  />
                  <div className="p-4 rounded-lg border-2 border-gray-600 bg-gray-700/30 hover:border-primary-100/50 peer-checked:border-primary-100 peer-checked:bg-primary-100/10 text-center transition-all">
                    <span className="block text-2xl mb-2">🎨</span>
                    <span className="block font-semibold text-gray-200">Artisan</span>
                    <span className="block text-xs text-gray-400 mt-1">Sell your crafts</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Phone</label>
                <input 
                  type="tel" 
                  name="phone" 
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 transition"
                  value={formData.phone} 
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Location</label>
                <input 
                  type="text" 
                  name="location" 
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 transition"
                  value={formData.location} 
                  onChange={handleChange}
                  placeholder="Accra, Ghana"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 mt-8 bg-gradient-to-r from-primary-100 to-accent text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary-100/50 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-100 hover:text-primary-80 font-semibold transition">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
