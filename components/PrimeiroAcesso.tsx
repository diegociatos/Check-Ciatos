import React, { useState } from 'react';
import { User } from '../types';
import { Lock, Eye, EyeOff, ShieldCheck, LogOut, Loader2, Check } from 'lucide-react';

interface PrimeiroAcessoProps {
  user: User;
  onDefinir: (novaSenha: string) => Promise<void>;
  onLogout: () => void;
}

const PrimeiroAcesso: React.FC<PrimeiroAcessoProps> = ({ user, onDefinir, onLogout }) => {
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [ver, setVer] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const regras = {
    tamanho: senha.length >= 6,
    diferente: senha !== '123456' && senha.length > 0,
    confere: senha.length > 0 && senha === confirma,
  };
  const valido = regras.tamanho && regras.diferente && regras.confere;

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!regras.tamanho) return setErro('A senha precisa ter ao menos 6 caracteres.');
    if (!regras.diferente) return setErro('Escolha uma senha diferente da padrão (123456).');
    if (!regras.confere) return setErro('As senhas não conferem.');
    setSalvando(true);
    try {
      await onDefinir(senha);
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível definir a senha. Tente de novo.');
      setSalvando(false);
    }
  };

  const Regra: React.FC<{ ok: boolean; children: React.ReactNode }> = ({ ok, children }) => (
    <li className={`flex items-center gap-2 text-xs ${ok ? 'text-emerald-600' : 'text-stone-400'}`}>
      <span className={`h-4 w-4 rounded-full flex items-center justify-center ${ok ? 'bg-emerald-100' : 'bg-stone-100'}`}>
        {ok && <Check size={11} />}
      </span>
      {children}
    </li>
  );

  return (
    <div className="min-h-screen bg-fundo flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-superficie rounded-2xl border border-stone-200 shadow-[0_10px_40px_rgba(28,25,23,0.10)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-marca text-white px-8 py-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-white/15 flex items-center justify-center mb-3">
            <ShieldCheck size={28} />
          </div>
          <h1 className="font-titulo text-2xl">Crie sua senha de acesso</h1>
          <p className="text-white/70 text-sm mt-1">Olá, {user.Nome.split(' ')[0]}! Este é seu primeiro acesso — defina uma senha só sua para continuar.</p>
        </div>

        <form onSubmit={submeter} className="p-8 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Nova senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type={ver ? 'text' : 'password'}
                autoFocus
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite a nova senha"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-marca/20"
              />
              <button type="button" onClick={() => setVer((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                {ver ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Confirmar senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type={ver ? 'text' : 'password'}
                value={confirma}
                onChange={(e) => setConfirma(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-marca/20"
              />
            </div>
          </div>

          <ul className="space-y-1.5 pt-1">
            <Regra ok={regras.tamanho}>Ao menos 6 caracteres</Regra>
            <Regra ok={regras.diferente}>Diferente da senha padrão</Regra>
            <Regra ok={regras.confere}>As duas senhas conferem</Regra>
          </ul>

          {erro && <p className="text-sm text-erro">{erro}</p>}

          <button
            type="submit"
            disabled={!valido || salvando}
            className="w-full inline-flex items-center justify-center gap-2 bg-marca text-white py-3 rounded-xl font-semibold hover:bg-marca-escuro transition-colors active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {salvando ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />} Definir senha e entrar
          </button>

          <button type="button" onClick={onLogout} className="w-full inline-flex items-center justify-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 pt-1">
            <LogOut size={14} /> Sair
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrimeiroAcesso;
