import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [selectedRole, setSelectedRole] = useState('buyer');

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div>Loading...</div>
      </div>
    );
  }

  const handleSignup = () => {
    loginWithRedirect({ 
      authorizationParams: { 
        screen_hint: 'signup',
        role: selectedRole 
      }
    });
  };

  return (
    <div className="auth-split-page">
      {/* Left Side - Image */}
      <div className="auth-image-side">
        <div className="auth-image-overlay"></div>
        <div className="auth-image-content">
          <h1 className="auth-image-title">CraftConnect</h1>
          <p className="auth-image-subtitle">
            Connecting authentic Ghanaian artisans with buyers worldwide
          </p>
          <div className="auth-image-features">
            <div className="auth-feature-item">
              <span className="auth-feature-check">✓</span>
              <span>Authentic handcrafted products</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-check">✓</span>
              <span>Support local artisans</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-check">✓</span>
              <span>Participate in live auctions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          {!showRoleSelect ? (
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">Welcome Back</h2>
                <p className="auth-form-subtitle">Sign in to your account to continue</p>
              </div>

              <div className="auth-form-content">
                <button 
                  onClick={() => loginWithRedirect({ authorizationParams: { connection: 'google-oauth2' } })}
                  className="btn-auth btn-google"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                    <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="auth-divider">
                  <span>or</span>
                </div>

                <button 
                  onClick={() => loginWithRedirect()}
                  className="btn-auth btn-email"
                >
                  Continue with Email
                </button>

                <div className="auth-signup-link">
                  Don't have an account?{' '}
                  <button 
                    onClick={() => setShowRoleSelect(true)}
                    className="link-signup"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">Join CraftConnect</h2>
                <p className="auth-form-subtitle">Choose your account type</p>
              </div>

              <div className="auth-form-content">
                <div className="role-cards">
                  <div 
                    className={`role-card ${selectedRole === 'buyer' ? 'selected' : ''}`}
                    onClick={() => setSelectedRole('buyer')}
                  >
                    <div className="role-icon">🛍️</div>
                    <h3>Buyer</h3>
                    <p>Browse and purchase authentic crafts</p>
                    <ul className="role-features">
                      <li>Shop handcrafted products</li>
                      <li>Participate in auctions</li>
                      <li>Leave reviews</li>
                    </ul>
                  </div>

                  <div 
                    className={`role-card ${selectedRole === 'artisan' ? 'selected' : ''}`}
                    onClick={() => setSelectedRole('artisan')}
                  >
                    <div className="role-icon">🎨</div>
                    <h3>Seller (Artisan)</h3>
                    <p>Sell your handcrafted products</p>
                    <ul className="role-features">
                      <li>List your products</li>
                      <li>Create auctions</li>
                      <li>Manage orders</li>
                    </ul>
                  </div>
                </div>

                <button 
                  onClick={handleSignup}
                  className="btn-auth btn-email"
                >
                  Continue as {selectedRole === 'buyer' ? 'Buyer' : 'Seller'}
                </button>

                <div className="auth-signup-link">
                  Already have an account?{' '}
                  <button 
                    onClick={() => setShowRoleSelect(false)}
                    className="link-signup"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="auth-footer">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
