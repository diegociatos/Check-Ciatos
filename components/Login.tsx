
import React, { useState } from 'react';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, senha?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      onLogin(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#8B1B1F] flex items-center justify-center p-6 relative overflow-hidden font-ciatos">
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-[20px] login-card-shadow overflow-hidden p-[40px] text-center relative flex flex-col min-h-[580px]">
          
          {/* Logo Section */}
          <div className="mx-auto mb-6">
            <div className="h-20 w-20 bg-[#8B1B1F] rounded-lg flex items-center justify-center text-white text-3xl font-bold shadow-md ring-4 ring-gray-50 overflow-hidden">
               {/* Using text representation as grupo.jpg is not available in the prompt environment */}
               <span className="font-serif italic">GC</span>
            </div>
          </div>

          <h1 className="text-[28px] font-bold text-[#111111] leading-tight mb-2">
            Bem-vindo ao Checklist Diário
          </h1>
          <p className="text-[14px] text-[#999999] font-normal mb-10">
            Acesse com seu email corporativo
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 flex-1 text-left">
            <div className="space-y-2">
              <input
                required
                type="email"
                placeholder="seu.email@ciatos.com.br"
                className={`w-full border border-[#E0E0E0] rounded-[8px] p-[12px] px-[15px] text-[14px] text-[#111111] focus:border-[#8B1B1F] focus:ring-0 outline-none transition-all duration-300 placeholder:text-gray-300`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  className={`w-full border border-[#E0E0E0] rounded-[8px] p-[12px] px-[15px] text-[14px] text-[#111111] focus:border-[#8B1B1F] focus:ring-0 outline-none transition-all duration-300 placeholder:text-gray-300`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#8B1B1F] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="text-right mt-2">
                <button 
                  type="button"
                  onClick={() => alert('Contate o administrador para resetar sua senha.')}
                  className="text-[12px] text-[#8B1B1F] hover:text-[#6F0F14] transition-colors font-medium"
                >
                  Esqueceu a senha?
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-[#C62828] p-4 rounded-lg flex items-start gap-3 text-[12px] font-bold border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-[#8B1B1F] text-white py-[14px] px-[30px] rounded-[8px] text-[16px] font-bold uppercase shadow-lg shadow-[#8B1B1F]/20 hover:bg-[#6F0F14] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  ENTRAR NO SISTEMA
                </>
              )}
            </button>
          </form>

          {/* Card Footer Fixed within card */}
          <div className="mt-8 pt-6 border-t border-gray-100">
             <p className="text-[#111111] text-[10px] font-normal">
              © 2026 Grupo Ciatos - Reestruturações Empresariais
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
