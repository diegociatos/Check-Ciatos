import React, { useState } from 'react';
import { Empresa, User } from '../types';
import { Building2, Plus, X, LogIn, Users as UsersIcon, CheckCircle2, Pause, Play, Trash2 } from 'lucide-react';

interface Props {
  empresas: Empresa[];
  users: User[]; // todos os usuários visíveis à plataforma (para contar por empresa)
  onCreate: (nome: string, plano: string, master: { nome: string; email: string }) => Promise<any>;
  onEnter: (empresaId: string) => void;
  onSuspend: (id: string, suspender: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PlatformClientsView: React.FC<Props> = ({ empresas, users, onCreate, onEnter, onSuspend, onDelete }) => {
  const [busy, setBusy] = useState<string | null>(null);

  const handleSuspend = async (e: Empresa) => {
    const suspender = (e.Status || 'Ativa') !== 'Suspensa';
    if (suspender && !window.confirm(`Suspender "${e.Nome}"? Os usuários dela não conseguirão acessar até você reativar.`)) return;
    setBusy(e.id);
    try { await onSuspend(e.id, suspender); } catch (err: any) { alert(err.message); } finally { setBusy(null); }
  };

  const handleDelete = async (e: Empresa) => {
    const membros = users.filter(u => u.empresa_id === e.id).length;
    if (!window.confirm(`EXCLUIR DEFINITIVAMENTE a empresa "${e.Nome}"?\n\nIsto apaga a equipe (${membros} usuário(s)), tarefas, modelos e pontos dela. NÃO pode ser desfeito.`)) return;
    if (!window.confirm(`Tem certeza absoluta? Digite OK na próxima. Confirmar exclusão de "${e.Nome}"?`)) return;
    setBusy(e.id);
    try { await onDelete(e.id); } catch (err: any) { alert(err.message); } finally { setBusy(null); }
  };
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [criada, setCriada] = useState<{ nome: string; email: string } | null>(null);
  const [form, setForm] = useState({ nome: '', plano: 'Padrao', masterNome: '', masterEmail: '' });

  const countMembros = (id: string) => users.filter(u => u.empresa_id === id).length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.masterNome || !form.masterEmail) return alert('Preencha empresa, nome e e-mail do responsável.');
    if (!form.masterEmail.includes('@')) return alert('E-mail inválido.');
    setSaving(true);
    try {
      await onCreate(form.nome, form.plano, { nome: form.masterNome, email: form.masterEmail });
      setCriada({ nome: form.nome, email: form.masterEmail });
      setForm({ nome: '', plano: 'Padrao', masterNome: '', masterEmail: '' });
      setOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar empresa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-ciatos pb-10 animate-in fade-in duration-500">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.14em]">Plataforma</p>
          <h1 className="text-3xl md:text-4xl text-stone-900 mt-1">Clientes</h1>
          <p className="text-stone-500 mt-1">Cada empresa tem sua própria equipe e dados isolados.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-marca text-white pl-5 pr-6 py-3.5 rounded-xl text-sm font-semibold hover:bg-marca-escuro transition-colors active:scale-[0.98]"
        >
          <Plus size={18} /> Nova empresa
        </button>
      </div>

      {criada && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-sm text-emerald-900">
            <p className="font-semibold">Empresa "{criada.nome}" criada.</p>
            <p className="mt-0.5">O responsável <span className="font-semibold">{criada.email}</span> já pode entrar com a senha provisória <span className="font-semibold">123456</span> (troca no primeiro acesso).</p>
          </div>
          <button onClick={() => setCriada(null)} className="ml-auto text-emerald-600"><X size={18} /></button>
        </div>
      )}

      {empresas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-12 text-center">
          <Building2 size={32} className="text-stone-300 mx-auto" />
          <p className="text-stone-500 mt-3">Nenhuma empresa ainda. Crie a primeira para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresas.map(e => {
            const suspensa = (e.Status || 'Ativa') === 'Suspensa';
            return (
              <div key={e.id} className={`bg-white rounded-2xl border shadow-[0_1px_2px_rgba(28,25,23,0.04)] p-6 flex flex-col ${suspensa ? 'border-amber-200 bg-amber-50/30' : 'border-[#E7E5E4]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${suspensa ? 'bg-amber-100 text-amber-600' : 'bg-marca/10 text-marca'}`}>
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg text-stone-900 truncate">{e.Nome}</p>
                    <p className="text-[11px] text-stone-400 uppercase tracking-wider">{e.Plano || 'Padrao'}</p>
                  </div>
                  {suspensa && (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wider">Suspensa</span>
                  )}
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm text-stone-500">
                  <UsersIcon size={15} /> {countMembros(e.id)} {countMembros(e.id) === 1 ? 'usuário' : 'usuários'}
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <button
                    onClick={() => onEnter(e.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 border border-marca text-marca py-3 rounded-xl text-sm font-semibold hover:bg-marca hover:text-white transition-colors"
                  >
                    <LogIn size={16} /> Entrar
                  </button>
                  <button
                    onClick={() => handleSuspend(e)}
                    disabled={busy === e.id}
                    title={suspensa ? 'Reativar' : 'Suspender'}
                    className="p-3 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-50"
                  >
                    {suspensa ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(e)}
                    disabled={busy === e.id}
                    title="Excluir empresa"
                    className="p-3 rounded-xl border border-stone-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xl text-stone-900">Nova empresa</h3>
              <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-600"><X size={22} /></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-5">
              <div>
                <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Nome da empresa</label>
                <input autoFocus className="mt-1 w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-marca/20" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Advocacia Silva" />
              </div>
              <div className="border-t border-stone-100 pt-5">
                <p className="text-sm text-stone-500 mb-3">Responsável (Master) da empresa — quem vai administrá-la:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Nome</label>
                    <input className="mt-1 w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-marca/20" value={form.masterNome} onChange={e => setForm({ ...form, masterNome: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">E-mail</label>
                    <input type="email" className="mt-1 w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-marca/20" value={form.masterEmail} onChange={e => setForm({ ...form, masterEmail: e.target.value })} />
                  </div>
                </div>
                <p className="text-xs text-stone-400 mt-3">O responsável entra com a senha provisória <span className="font-semibold">123456</span> e troca no primeiro acesso.</p>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-marca text-white py-4 rounded-xl font-semibold hover:bg-marca-escuro transition-colors disabled:opacity-60">
                {saving ? 'Criando...' : 'Criar empresa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformClientsView;
