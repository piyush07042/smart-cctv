import React, { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoggingIn } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username || !password) return;
    
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    try {
      await login(params);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setErrorMsg('Invalid username or password');
      } else {
        setErrorMsg('An error occurred during login. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-green-200 rounded-xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-green-300">
            <ShieldAlert className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-900 tracking-wider">Smart CCTV</h1>
          <p className="text-green-700 mt-2 text-sm">Sign in to access the control room</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-green-800 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-green-50 border border-green-200 rounded-md px-4 py-2.5 text-green-900 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
              placeholder="Enter your username"
              disabled={isLoggingIn}
              autoComplete="username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-green-800 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-green-50 border border-green-200 rounded-md px-4 py-2.5 text-green-900 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
              placeholder="Enter your password"
              disabled={isLoggingIn}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || !username || !password}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
          >
            {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-green-200 text-xs text-green-600 text-center">
          <p>Demo Credentials:</p>
          <p className="mt-1">Admin: <span className="font-mono text-green-700">admin / admin</span></p>
          <p>Operator: <span className="font-mono text-green-700">operator / operator</span></p>
          <p>Viewer: <span className="font-mono text-green-700">viewer / viewer</span></p>
        </div>
      </div>
    </div>
  );
};
