
import React, { useState } from 'react';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  // Pode ser assíncrono (autenticação real retorna Promise); aceitamos void também.
  onLogin: (email: string, senha?: string) => Promise<unknown> | void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecoveryHelp, setShowRecoveryHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // impede duplo clique / submit duplicado enquanto autentica
    setError('');
    setLoading(true);

    try {
      // Aguarda a autenticação real: mantém o loading ativo até resolver/rejeitar
      // e permite que erros de Promise rejeitada sejam capturados aqui.
      await onLogin(email.trim(), password);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível entrar. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen min-h-dvh bg-fundo flex items-center justify-center p-4 sm:p-8 relative font-ciatos">
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200/80 p-6 sm:p-10 text-center relative flex flex-col">
          
          {/* Logo Section */}
          <div className="mx-auto mb-6">
            <div className="h-14 w-14 bg-marca rounded-2xl flex items-center justify-center text-white shadow-md ring-4 ring-gray-50 overflow-hidden">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10" aria-hidden="true">
                 <path d="M11 12.5l3.5 3.5 7-8" strokeWidth={2.4} strokeOpacity={0.5} /><path d="M3 12.5l4 4 8.5-9.5" />
               </svg>
            </div>
          </div>

          <h1 className="text-[28px] font-bold text-[#111111] leading-tight mb-2">
            Bem-vindo ao Chekly
          </h1>
          <p className="text-sm text-stone-600 font-normal mb-8">
            Sua rotina organizada, uma tarefa de cada vez.
          </p>

          <form onSubmit={handleSubmit} aria-busy={loading} className="space-y-5 flex-1 text-left">
            <div className="space-y-2">
              <label htmlFor="login-email" className="block text-sm font-medium text-stone-700">E-mail corporativo</label>
              <input
                id="login-email"
                name="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                type="email"
                placeholder="voce@empresa.com.br"
                className="w-full border border-stone-300 rounded-xl p-3 text-base text-tinta focus:border-marca focus:ring-2 focus:ring-marca/20 outline-none transition-colors placeholder:text-stone-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="block text-sm font-medium text-stone-700">Senha</label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  className="w-full border border-stone-300 rounded-xl p-3 pr-14 text-base text-tinta focus:border-marca focus:ring-2 focus:ring-marca/20 outline-none transition-colors placeholder:text-stone-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-3 rounded-lg text-stone-500 hover:text-marca transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="text-right mt-2">
                <button 
                  type="button"
                  onClick={() => setShowRecoveryHelp(v => !v)}
                  aria-expanded={showRecoveryHelp}
                  aria-controls="recovery-help"
                  className="text-sm py-2 text-marca hover:text-marca-escuro transition-colors font-medium"
                >
                  Esqueceu a senha?
                </button>
              </div>
              {showRecoveryHelp && <p id="recovery-help" role="status" className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-sm text-stone-600">Peça ao administrador da sua empresa um link para redefinir sua senha.</p>}
            </div>

            {error && (
              <div role="alert" className="bg-red-50 text-[#C62828] p-4 rounded-lg flex items-start gap-3 text-sm border border-red-100">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-marca text-white py-3.5 px-6 rounded-xl text-base font-semibold shadow-sm hover:bg-marca-escuro transition-colors flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-wait"
            >
              {loading ? (
                <><span aria-hidden="true" className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Entrando…</>
              ) : (
                <>
                  <LogIn size={20} />
                  Entrar
                </>
              )}
            </button>
          </form>

          {/* Card Footer Fixed within card */}
          <div className="mt-8 pt-6 border-t border-gray-100">
             <p className="text-stone-500 text-xs leading-relaxed">
              © 2026 Chekly · CIATOS SOFTWARES E SERVICOS LTDA
             </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
