import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, AlertTriangle, Crown, Shield, LogIn, X, HelpCircle, Key } from 'lucide-react';
import { authAPI } from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null); // 'admin' or 'student'
  const [idProofFile, setIdProofFile] = useState(null);
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'student',
    idProofType: 'Aadhar',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: ''
  });

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetQuestion, setResetQuestion] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Answer & New Pass

  // Clear form when role changes
  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
  }, [selectedRole]);

  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result) {
        navigate(result.user.role === 'admin' ? '/admin' : '/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!signUpData.securityAnswer) {
      setError('Please provide a security answer');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', signUpData.name);
      formData.append('email', signUpData.email);
      formData.append('password', signUpData.password);
      formData.append('phone', signUpData.phone);
      formData.append('role', signUpData.role);
      formData.append('idProofType', signUpData.idProofType);
      formData.append('securityQuestion', signUpData.securityQuestion);
      formData.append('securityAnswer', signUpData.securityAnswer);
      if (idProofFile) {
        formData.append('idProof', idProofFile);
      }

      const result = await register(formData);
      if (result) {
        navigate(result.user.role === 'admin' ? '/admin' : '/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.forgotPasswordQuestion(forgotIdentifier);
      setResetQuestion(response.data.securityQuestion);
      setForgotStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Account not found');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPasswordReset({
        identifier: forgotIdentifier,
        answer: resetAnswer,
        newPassword: newPassword
      });
      setSuccess('Password reset successfully. You can now login.');
      setShowForgotModal(false);
      setForgotStep(1);
      setForgotIdentifier('');
      setResetAnswer('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-8 text-white text-center">
            <div className="text-5xl font-bold mb-2">🏨</div>
            <h1 className="text-3xl font-bold mb-2">Havenly</h1>
            <p className="text-indigo-100">Hostel & PG Management System</p>
          </div>

          {/* Role Selection */}
          {!selectedRole ? (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Select Your Role</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setSelectedRole('admin');
                    setSignUpData({ ...signUpData, role: 'admin' });
                  }}
                  className="p-6 border-2 border-slate-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition group"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition">👨‍💼</div>
                  <h3 className="font-bold text-slate-900 mb-2">Administrator</h3>
                  <p className="text-sm text-slate-600">Manage hostel operations</p>
                </button>

                <button
                  onClick={() => {
                    setSelectedRole('student');
                    setSignUpData({ ...signUpData, role: 'student' });
                  }}
                  className="p-6 border-2 border-slate-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition group"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition">👨‍🎓</div>
                  <h3 className="font-bold text-slate-900 mb-2">Student</h3>
                  <p className="text-sm text-slate-600">Access your room & pay dues</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8">
            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-200">
              <button
                onClick={() => setIsSignUp(false)}
                className={`pb-4 px-4 font-semibold transition ${
                  !isSignUp ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-600'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`pb-4 px-4 font-semibold transition ${
                  isSignUp ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-600'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setSelectedRole(null)}
                className="ml-auto pb-4 px-4 font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                ← Change Role
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {success}
              </div>
            )}

            {!isSignUp ? (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                    required
                    autoComplete="off"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pr-10"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogIn size={20} />
                  <span>{loading ? 'Logging in...' : 'Login'}</span>
                </button>

                {/* Demo credentials info */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 text-center">
                    <span className="font-medium">Demo Credentials:</span><br/>
                    Student: student-test@havenly.com / student123
                  </p>
                </div>
              </form>
            ) : (
              // Sign Up Form
              <form onSubmit={handleSignUp} className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar" autoComplete="off">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={signUpData.name}
                    onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                    placeholder="John Doe"
                    className="input-field"
                    required
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="input-field"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="input-field"
                    required
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      placeholder="••••••••"
                      className="input-field pr-10"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                    <Shield size={14} /> Recovery Security
                  </h4>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Security Question</label>
                    <select
                      value={signUpData.securityQuestion}
                      onChange={(e) => setSignUpData({ ...signUpData, securityQuestion: e.target.value })}
                      className="input-field py-1.5 text-sm"
                    >
                      <option>What is your favorite color?</option>
                      <option>What was your first pet's name?</option>
                      <option>What is your mother's maiden name?</option>
                      <option>What city were you born in?</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Your Answer</label>
                    <input
                      type="text"
                      value={signUpData.securityAnswer}
                      onChange={(e) => setSignUpData({ ...signUpData, securityAnswer: e.target.value })}
                      placeholder="Answer for password recovery"
                      className="input-field py-1.5 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ID Proof Type</label>
                  <select
                    value={signUpData.idProofType}
                    onChange={(e) => setSignUpData({ ...signUpData, idProofType: e.target.value })}
                    className="input-field"
                  >
                    <option value="Aadhar">Aadhar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="DrivingLicense">Driving License</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Upload ID Proof</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setIdProofFile(e.target.files[0])}
                    className="input-field"
                    required
                  />
                  {idProofFile && <p className="text-xs text-green-600 mt-1">✓ {idProofFile.name}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  <LogIn size={20} />
                  <span>{loading ? 'Creating account...' : 'Sign Up'}</span>
                </button>
              </form>
            )}
          </div>
          )}

          {/* Forgot Password Modal */}
          {showForgotModal && (
            <div className="absolute inset-0 bg-white z-50 p-8 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Key className="text-indigo-600" /> Reset Password
                </h2>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStep(1);
                    setError('');
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotStep1} className="space-y-6">
                  <p className="text-slate-600 text-sm">Enter your registered email or phone number to find your security question.</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email or Phone Number</label>
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="Email or Phone Number"
                      className="input-field"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3"
                  >
                    {loading ? 'Finding Account...' : 'Continue'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotStep2} className="space-y-6">
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <label className="block text-xs font-bold text-indigo-700 uppercase mb-2">Security Question</label>
                    <p className="text-slate-900 font-medium mb-4 flex items-center gap-2 text-sm">
                      <HelpCircle size={18} className="text-indigo-600" /> {resetQuestion}
                    </p>
                    <label className="block text-sm font-medium text-indigo-800 mb-2">Your Answer</label>
                    <input
                      type="text"
                      value={resetAnswer}
                      onChange={(e) => setResetAnswer(e.target.value)}
                      placeholder="Type your answer exactly"
                      className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="input-field"
                      required
                      minLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3"
                  >
                    {loading ? 'Resetting...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium"
                  >
                    Back to start
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-6">
          © 2024 Havenly. All rights reserved.
        </p>

        {/* Super Admin Access */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/super-admin-login')}
            className="text-yellow-600 hover:text-yellow-700 text-sm font-medium flex items-center space-x-2 mx-auto"
          >
            <Crown size={16} />
            <span>Super Admin Access</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
