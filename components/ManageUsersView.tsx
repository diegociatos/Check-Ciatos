
import React, { useState, useMemo } from 'react';
import { User, UserRole, UserStatus } from '../types';
// Fixed: Added RefreshCw to lucide-react imports
import { 
  Plus, Trash2, Edit3, Lock, Shield, 
  UserCheck, X, Save, User as UserIcon, 
  UserMinus, UserRoundSearch, Calendar, Mail,
  RefreshCw 
} from 'lucide-react';

interface ManageUsersViewProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: Partial<User>) => void;
  onUpdateUser: (email: string, user: Partial<User>) => void;
  onResetPassword: (email: string) => void;
  onToggleStatus: (email: string) => void;
  onDeleteUser: (email: string) => void;
  onChangeEmail: (email: string, novoEmail: string) => Promise<{ relogar: boolean }>;
  empresas?: { id: string; Nome: string }[];
  activeEmpresa?: string | null;
  onSetEmpresas?: (email: string, ids: string[]) => Promise<void>;
  getUserEmpresas?: (email: string) => Promise<string[]>;
}

const ManageUsersView: React.FC<ManageUsersViewProps> = ({
  users, currentUser, onAddUser, onUpdateUser, onResetPassword, onToggleStatus, onDeleteUser, onChangeEmail,
  empresas = [], activeEmpresa, onSetEmpresas, getUserEmpresas
}) => {
  // Gestor só cadastra COLABORADOR (vinculado a ele). Admin/Master/Plataforma criam qualquer papel.
  const souGestor = currentUser.Role === UserRole.GESTOR;
  const [emailAlvo, setEmailAlvo] = useState<User | null>(null);
  const [novoEmail, setNovoEmail] = useState('');
  const [mudandoEmail, setMudandoEmail] = useState(false);
  const [erroEmail, setErroEmail] = useState('');

  const confirmarTrocaEmail = async () => {
    setErroEmail('');
    if (!novoEmail.includes('@')) return setErroEmail('E-mail inválido.');
    setMudandoEmail(true);
    try {
      const r = await onChangeEmail(emailAlvo!.Email, novoEmail.trim().toLowerCase());
      setEmailAlvo(null);
      setNovoEmail('');
      if (r?.relogar) alert('Seu e-mail foi alterado. Entre novamente com o novo e-mail.');
    } catch (e: any) {
      setErroEmail(e?.message || 'Não foi possível alterar o e-mail.');
    } finally {
      setMudandoEmail(false);
    }
  };
  // Empresas que o gestor atende (quando há mais de uma empresa para escolher)
  const [empresasGestor, setEmpresasGestor] = useState<string[]>([]);
  const multiEmpresa = empresas.length > 1;
  const toggleEmpresaGestor = (id: string) =>
    setEmpresasGestor(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    Nome: '', Email: '', Role: UserRole.COLABORADOR, Time: '', Telefone: '', DataNascimento: '', Gestor: '', Status: UserStatus.ATIVO
  });

  // Ordenação Alfabética por Nome conforme requisito
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.Nome.localeCompare(b.Nome));
  }, [users]);

  const gestores = users.filter(u => u.Role === UserRole.GESTOR || u.Role === UserRole.ADMIN);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Gestor só cria colaborador, sempre vinculado a ele mesmo (trava de segurança).
      if (souGestor && !editingEmail) {
        formData.Role = UserRole.COLABORADOR;
        formData.Gestor = currentUser.Email;
      }

      if (!formData.Email || !formData.Email.includes('@')) throw new Error("Formato de E-mail inválido.");
      if (!formData.Nome) throw new Error("O Nome é obrigatório.");
      if (formData.Role === UserRole.COLABORADOR && !formData.Gestor) {
        throw new Error("Todo colaborador deve ter um Gestor Responsável vinculado.");
      }

      const email = editingEmail || formData.Email!;
      const ehGestor = formData.Role === UserRole.GESTOR;

      let addRes: any = null;
      if (editingEmail) {
        await Promise.resolve(onUpdateUser(editingEmail, formData));
      } else {
        addRes = await Promise.resolve(onAddUser(formData));
      }

      // Gestor multi-empresa: concede acesso às empresas escolhidas (+ a empresa atual)
      if (ehGestor && multiEmpresa && onSetEmpresas) {
        const alvo = Array.from(new Set([...(activeEmpresa ? [activeEmpresa] : []), ...empresasGestor]));
        await onSetEmpresas(email, alvo);
      }

      setIsModalOpen(false);
      resetForm();
      if (!editingEmail) {
        if (addRes?.vinculado) alert("Usuário vinculado a esta empresa com sucesso.");
        else if (addRes?.invited) alert("Usuário cadastrado.\n\nUm convite para o usuário definir a própria senha foi enviado por e-mail (o link expira).");
        else if (addRes?.inviteLink) window.prompt("Usuário cadastrado, mas não foi possível enviar o e-mail.\nCopie e envie este link de convite ao usuário (expira):", addRes.inviteLink);
        else alert("Usuário cadastrado com sucesso. Um convite para definir a senha foi enviado por e-mail.");
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar.');
    }
  };

  const handleResetPasswordAction = async (email: string) => {
    if (!window.confirm(`Deseja realmente resetar a senha do usuário ${email}?`)) return;
    try {
      const res: any = await Promise.resolve(onResetPassword(email));
      if (res?.invited) alert("Convite de nova senha enviado por e-mail (o link expira).");
      else if (res?.inviteLink) window.prompt("Não foi possível enviar o e-mail.\nCopie e envie este link ao usuário (expira):", res.inviteLink);
      else alert(res?.message || "Senha redefinida. Um convite foi enviado por e-mail.");
    } catch (e: any) {
      alert(e?.message || 'Erro ao resetar a senha.');
    }
  };

  const resetForm = () => {
    setEditingEmail(null);
    setFormData({
      Nome: '', Email: '', Role: UserRole.COLABORADOR, Time: '',
      Telefone: '', DataNascimento: '', Gestor: '', Status: UserStatus.ATIVO
    });
    setEmpresasGestor(activeEmpresa ? [activeEmpresa] : []);
  };

  const openEdit = async (user: User) => {
    setEditingEmail(user.Email);
    setFormData({ ...user });
    setEmpresasGestor(activeEmpresa ? [activeEmpresa] : []);
    if (user.Role === UserRole.GESTOR && getUserEmpresas) {
      try { const ids = await getUserEmpresas(user.Email); if (ids.length) setEmpresasGestor(ids); } catch { /* ignore */ }
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-ciatos pb-20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.14em]">Equipe</p>
          <h3 className="text-3xl md:text-4xl text-stone-900 mt-1">Gerenciar usuários</h3>
          <p className="text-stone-500 mt-1">Cadastre e organize as pessoas da empresa.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 bg-marca text-white pl-5 pr-6 py-3.5 rounded-xl text-sm font-semibold hover:bg-marca-escuro transition-colors active:scale-[0.98]"
        >
          <Plus size={18} /> Novo usuário
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Colaborador</th>
                <th className="px-8 py-5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Cargo / Gestor</th>
                <th className="px-8 py-5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider text-center">Criado em</th>
                <th className="px-8 py-5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-bold">
              {sortedUsers.map(user => (
                <tr key={user.Email} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-marca rounded-2xl flex items-center justify-center text-white text-sm font-black overflow-hidden shadow-sm">
                        {user.Foto ? <img src={user.Foto} className="w-full h-full object-cover" /> : user.Nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[#111111] text-sm">{user.Nome}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{user.Email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-marca uppercase tracking-tighter text-[11px]">{user.Role}</span>
                      {user.Role === UserRole.COLABORADOR && (
                         <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                           <UserRoundSearch size={10} /> Gestor: {users.find(u => u.Email === user.Gestor)?.Nome || 'NÃO DEFINIDO'}
                         </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      user.Status === UserStatus.ATIVO ? 'bg-green-50 text-green-600 border-green-100' :
                      user.Status === UserStatus.BLOQUEADO ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-gray-100 text-gray-400 border-gray-200'
                    }`}>
                      {user.Status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center text-gray-400 font-bold text-[10px]">
                    {user.DataCriacao || '---'}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(user)} className="p-2 text-gray-400 hover:text-marca hover:bg-gray-50 rounded-xl transition-all" title="Editar">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleResetPasswordAction(user.Email)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Resetar Senha para 123456">
                        <RefreshCw size={16} />
                      </button>
                      {!souGestor && (
                        <button onClick={() => { setEmailAlvo(user); setNovoEmail(''); setErroEmail(''); }} className="p-2 text-gray-400 hover:text-marca hover:bg-gray-50 rounded-xl transition-all" title="Alterar e-mail">
                          <Mail size={16} />
                        </button>
                      )}
                      <button onClick={() => onToggleStatus(user.Email)} className={`p-2 rounded-xl transition-all ${user.Status === UserStatus.ATIVO ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`} title="Ativar/Inativar">
                        {user.Status === UserStatus.ATIVO ? <UserMinus size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button onClick={() => onDeleteUser(user.Email)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Excluir Usuário">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50">
               <h3 className="text-xl text-stone-900">{editingEmail ? 'Editar usuário' : 'Novo usuário'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-gray-500"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-2"><UserIcon size={12}/> Nome Completo</label>
                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-marca/10" value={formData.Nome} onChange={e => setFormData({...formData, Nome: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-2"><Mail size={12}/> E-mail Corporativo</label>
                    <input required type="email" readOnly={!!editingEmail} className={`w-full border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none ${editingEmail ? 'bg-gray-100' : 'bg-gray-50 focus:ring-4 focus:ring-marca/10'}`} value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-2"><Shield size={12}/> Cargo / Permissão</label>
                    <select required disabled={souGestor} className={`w-full border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none ${souGestor ? 'bg-gray-100 text-stone-500' : 'bg-gray-50'}`} value={souGestor ? UserRole.COLABORADOR : formData.Role} onChange={e => setFormData({...formData, Role: e.target.value as UserRole})}>
                      <option value={UserRole.COLABORADOR}>Colaborador</option>
                      {!souGestor && <option value={UserRole.GESTOR}>Gestor</option>}
                      {!souGestor && <option value={UserRole.ADMIN}>Administrador Master</option>}
                    </select>
                    {souGestor && <p className="text-[11px] text-stone-400 mt-1">Gestores cadastram colaboradores, vinculados a você.</p>}
                  </div>
                  
                  {/* Regra de Negócio: Gestor obrigatório apenas para Colaborador.
                      Para a gestora, o vínculo é automático (ela mesma) — não mostra o seletor. */}
                  {formData.Role === UserRole.COLABORADOR && !souGestor && (
                    <div className="space-y-1 animate-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-marca uppercase tracking-widest flex items-center gap-2">
                        <UserRoundSearch size={12} /> Gestor Responsável *
                      </label>
                      <select required className="w-full bg-white border-2 border-marca/20 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Gestor} onChange={e => setFormData({...formData, Gestor: e.target.value})}>
                        <option value="">Vincular a um Gestor...</option>
                        {gestores.map(g => <option key={g.Email} value={g.Email}>{g.Nome}</option>)}
                      </select>
                    </div>
                  )}

                  {formData.Role === UserRole.GESTOR && multiEmpresa && (
                    <div className="space-y-1 md:col-span-2 animate-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-marca uppercase tracking-widest">Empresas que este gestor atende</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-4 max-h-44 overflow-y-auto">
                        {empresas.map(e => {
                          const bloqueado = e.id === activeEmpresa; // empresa atual sempre incluída
                          const marcado = bloqueado || empresasGestor.includes(e.id);
                          return (
                            <label key={e.id} className={`flex items-center gap-2 text-sm font-bold ${bloqueado ? 'text-gray-400' : 'text-gray-700 cursor-pointer'}`}>
                              <input type="checkbox" checked={marcado} disabled={bloqueado} onChange={() => toggleEmpresaGestor(e.id)} className="accent-marca h-4 w-4" />
                              {e.Nome}
                            </label>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold">A empresa atual é sempre incluída. Marque as demais que ele também atende.</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Time / Departamento</label>
                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Time} onChange={e => setFormData({...formData, Time: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-2"><Calendar size={12}/> Nascimento</label>
                    <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.DataNascimento} onChange={e => setFormData({...formData, DataNascimento: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Status da Conta</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Status} onChange={e => setFormData({...formData, Status: e.target.value as UserStatus})}>
                      <option value={UserStatus.ATIVO}>Ativo</option>
                      <option value={UserStatus.INATIVO}>Inativo</option>
                      <option value={UserStatus.BLOQUEADO}>Bloqueado</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-stone-300 uppercase tracking-wider">Senha Provisória</label>
                    <div className="w-full bg-gray-100 border border-gray-200 rounded-2xl p-4 text-sm font-black text-gray-400 italic">
                      {editingEmail ? "Confidencial" : "Padrão: 123456"}
                    </div>
                  </div>
               </div>
               
               <div className="pt-6 border-t border-gray-100">
                  <button type="submit" className="w-full bg-marca text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-marca-escuro transition-all hover:scale-[1.01] active:scale-95">
                    <Save size={20} /> {editingEmail ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: alterar e-mail (chave do usuário) */}
      {emailAlvo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-titulo text-xl text-tinta">Alterar e-mail</h3>
              <button onClick={() => setEmailAlvo(null)} className="text-gray-300 hover:text-gray-500"><X size={22} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Usuário</p>
                <p className="text-sm text-tinta mt-0.5">{emailAlvo.Nome}</p>
                <p className="text-xs text-stone-400">E-mail atual: {emailAlvo.Email}</p>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Novo e-mail (login)</label>
                <input
                  type="email"
                  autoFocus
                  value={novoEmail}
                  onChange={e => setNovoEmail(e.target.value)}
                  placeholder="novo@empresa.com.br"
                  className="mt-1.5 w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-marca/20"
                />
              </div>
              <p className="text-xs text-stone-400">O novo e-mail passa a ser o login. As tarefas e pontos da pessoa são transferidos automaticamente. Ela deve usar o novo e-mail no próximo acesso.</p>
              {erroEmail && <p className="text-sm text-erro">{erroEmail}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEmailAlvo(null)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-tinta hover:bg-stone-50">Cancelar</button>
                <button onClick={confirmarTrocaEmail} disabled={mudandoEmail} className="flex-1 py-2.5 rounded-xl bg-marca text-white text-sm font-semibold hover:bg-marca-escuro disabled:opacity-60">
                  {mudandoEmail ? 'Alterando…' : 'Alterar e-mail'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersView;
