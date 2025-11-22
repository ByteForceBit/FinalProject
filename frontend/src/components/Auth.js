// components/Auth.js

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import { Zap, LogIn, UserPlus, Mail, Lock, Building2, FileText } from 'lucide-react';
import Footer from '../components/Footer'
export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enterpriseName, setEnterpriseName] = useState(''); // NEW STATE
  const [gstNo, setGstNo] = useState('');               // NEW STATE
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSigningUp, setIsSigningUp] = useState(false); // Toggle state
  const router = useRouter();

  // --- Auth Handlers ---

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Supabase allows passing a 'data' object for custom user metadata
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          enterprise_name: enterpriseName, // Send Enterprise Name
          gst_no: gstNo,                  // Send GST No.
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setError('Success! Check your email for the confirmation link to activate your account.');
      setLoading(false);
    }
  };

  // --- UI Structure (Colorful & 3D Styling) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
     <div className="flex-1 flex justify-center items-center p-4">
      <div className="w-full max-w-lg p-8 space-y-8 bg-white/5 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] border border-white/10">
       
        {/* Header and Branding */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Smart Tax Manager
          </h2>
          <p className="text-purple-300 mt-2">Identify financial leakages & maximize ITC.</p>
        </div>

        {/* Auth Toggle */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => { setIsSigningUp(false); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 text-sm font-semibold ${
              !isSigningUp
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-purple-300 hover:text-white'
            }`}
            disabled={loading}
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </button>
          <button
            onClick={() => { setIsSigningUp(true); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 text-sm font-semibold ${
              isSigningUp
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-purple-300 hover:text-white'
            }`}
            disabled={loading}
          >
            <UserPlus className="w-5 h-5" />
            Create Account
          </button>
        </div>
        
        {/* Error/Success Message */}
        {error && (
          <div className={`p-4 text-sm font-medium rounded-xl border ${
              error.includes('Success') || error.includes('confirmation') 
                ? 'bg-green-900/50 text-green-300 border-green-700/50' 
                : 'bg-red-900/50 text-red-300 border-red-700/50'
          }`}>
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={isSigningUp ? handleSignup : handleLogin}>
          
          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 w-full px-3 py-4 border border-white/10 rounded-xl shadow-inner bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              required
            />
          </div>
          
          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 w-full px-3 py-4 border border-white/10 rounded-xl shadow-inner bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              required
            />
          </div>

          {/* New Fields (Only show for Sign Up) */}
          {isSigningUp && (
            <div className="space-y-4 pt-2">
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Enterprise/Business Name"
                  value={enterpriseName}
                  onChange={(e) => setEnterpriseName(e.target.value)}
                  className="pl-12 w-full px-3 py-4 border border-white/10 rounded-xl shadow-inner bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                  required
                />
              </div>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="text"
                  placeholder="GST No. (Optional)"
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  className="pl-12 w-full px-3 py-4 border border-white/10 rounded-xl shadow-inner bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Submission Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 mt-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.01]"
          >
            {loading 
              ? (isSigningUp ? 'Processing...' : 'Signing In...') 
              : (isSigningUp ? 'Create Smart Account' : 'Sign In to Dashboard')}
          </button>
        </form>
      </div>
      </div>
      <Footer/>
    </div>
  );
}
