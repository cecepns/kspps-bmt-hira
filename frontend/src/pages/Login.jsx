import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import toast from 'react-hot-toast';
import { LogIn, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Username dan password wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.LOGIN, { username, password });
      if (res.success) {
        toast.success(`Selamat datang, ${res.user.nama}!`);
        localStorage.setItem('bmt_token', res.token);
        localStorage.setItem('bmt_user', JSON.stringify(res.user));
        onLoginSuccess(res.user);
        navigate('/');
      } else {
        toast.error(res.message || 'Login gagal');
      }
    } catch (err) {
      toast.error(err.message || 'Username atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Glowing Accents */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative z-10">
        <div className="p-8 sm:p-10">
          {/* Logo Header */}
          <div className="text-center flex flex-col items-center mb-8">
            <div className="w-28 h-28 mb-4 flex items-center justify-center">
              <img 
                src="/logo.jpeg" 
                alt="KSPPS BMT Hira Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">KSPPS BMT HIRA</h1>
            <p className="text-xs font-semibold text-sky-600 tracking-wide uppercase mt-0.5">Mitra Tepat Bermuamalat</p>
            <p className="text-xs text-slate-500 mt-2">Masuk ke sistem pencatatan & laporan harian</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm transition bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm transition bg-slate-50/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold rounded-xl shadow-lg shadow-sky-600/30 transition duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>MASUK SAKU BMT</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Help */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
              Demo: admin / admin123 atau ahmad / pegawai123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
