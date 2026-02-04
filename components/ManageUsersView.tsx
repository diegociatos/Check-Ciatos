
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
  onAddUser: (user: Partial<User>) => void;
  onUpdateUser: (email: string, user: Partial<User>) => void;
  onResetPassword: (email: string) => void;
  onToggleStatus: (email: string) => void;
  onDeleteUser: (email: string) => void;
}

const ManageUsersView: React.FC<ManageUsersViewProps> = ({ 
  users, onAddUser, onUpdateUser, onResetPassword, onToggleStatus, onDeleteUser 
}) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validações de E-mail e Obrigatoriedade
      if (!formData.Email || !formData.Email.includes('@')) {
        throw new Error("Formato de E-mail inválido.");
      }
      
      if (!formData.Nome) {
        throw new Error("O Nome é obrigatório.");
      }

      if (formData.Role === UserRole.COLABORADOR && !formData.Gestor) {
        throw new Error("Todo colaborador deve ter um Gestor Responsável vinculado.");
      }
      
      if (editingEmail) {
        onUpdateUser(editingEmail, formData);
        setIsModalOpen(false);
        resetForm();
      } else {
        onAddUser(formData);
        setIsModalOpen(false);
        resetForm();
        // Pop-up com senha provisória conforme solicitado
        alert("Usuário cadastrado com sucesso.\n\nSenha provisória: 123456\nO usuário deverá alterá-la obrigatoriamente no primeiro acesso.");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPasswordAction = (email: string) => {
    if (window.confirm(`Deseja realmente resetar a senha do usuário ${email}?`)) {
      onResetPassword(email);
      alert("Senha redefinida com sucesso para o padrão: 123456");
    }
  };

  const resetForm = () => {
    setEditingEmail(null);
    setFormData({ 
      Nome: '', Email: '', Role: UserRole.COLABORADOR, Time: '', 
      Telefone: '', DataNascimento: '', Gestor: '', Status: UserStatus.ATIVO 
    });
  };

  const openEdit = (user: User) => {
    setEditingEmail(user.Email);
    setFormData({ ...user });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-ciatos pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-bold text-[#8B1B1F] uppercase tracking-tighter">Gerenciar Usuários</h3>
          <p className="text-sm text-gray-400 font-medium mt-1">Administração estratégica do capital humano Ciatos.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }} 
          className="flex items-center gap-2 bg-[#8B1B1F] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all"
        >
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargo / Gestor</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Criado em</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-bold">
              {sortedUsers.map(user => (
                <tr key={user.Email} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-[#8B1B1F] rounded-2xl flex items-center justify-center text-white text-sm font-black overflow-hidden shadow-sm">
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
                      <span className="text-[#8B1B1F] uppercase tracking-tighter text-[11px]">{user.Role}</span>
                      {user.Role === UserRole.COLABORADOR && (
                         <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1">
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
                      <button onClick={() => openEdit(user)} className="p-2 text-gray-400 hover:text-[#8B1B1F] hover:bg-gray-50 rounded-xl transition-all" title="Editar">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleResetPasswordAction(user.Email)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Resetar Senha para 123456">
                        <RefreshCw size={16} />
                      </button>
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
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50">
               <h3 className="text-xl font-bold text-[#111111] uppercase tracking-tighter">{editingEmail ? 'Editar Usuário Ciatos' : 'Novo Usuário Corporativo'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-gray-500"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><UserIcon size={12}/> Nome Completo</label>
                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#8B1B1F]/10" value={formData.Nome} onChange={e => setFormData({...formData, Nome: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Mail size={12}/> E-mail Corporativo</label>
                    <input required type="email" readOnly={!!editingEmail} className={`w-full border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none ${editingEmail ? 'bg-gray-100' : 'bg-gray-50 focus:ring-4 focus:ring-[#8B1B1F]/10'}`} value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Shield size={12}/> Cargo / Permissão</label>
                    <select required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Role} onChange={e => setFormData({...formData, Role: e.target.value as UserRole})}>
                      <option value={UserRole.COLABORADOR}>Colaborador</option>
                      <option value={UserRole.GESTOR}>Gestor</option>
                      <option value={UserRole.ADMIN}>Administrador Master</option>
                    </select>
                  </div>
                  
                  {/* Regra de Negócio: Gestor obrigatório apenas para Colaborador */}
                  {formData.Role === UserRole.COLABORADOR && (
                    <div className="space-y-1 animate-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest flex items-center gap-2">
                        <UserRoundSearch size={12} /> Gestor Responsável *
                      </label>
                      <select required className="w-full bg-white border-2 border-[#8B1B1F]/20 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Gestor} onChange={e => setFormData({...formData, Gestor: e.target.value})}>
                        <option value="">Vincular a um Gestor...</option>
                        {gestores.map(g => <option key={g.Email} value={g.Email}>{g.Nome}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time / Departamento</label>
                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Time} onChange={e => setFormData({...formData, Time: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={12}/> Nascimento</label>
                    <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.DataNascimento} onChange={e => setFormData({...formData, DataNascimento: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status da Conta</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Status} onChange={e => setFormData({...formData, Status: e.target.value as UserStatus})}>
                      <option value={UserStatus.ATIVO}>Ativo</option>
                      <option value={UserStatus.INATIVO}>Inativo</option>
                      <option value={UserStatus.BLOQUEADO}>Bloqueado</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Senha Provisória</label>
                    <div className="w-full bg-gray-100 border border-gray-200 rounded-2xl p-4 text-sm font-black text-gray-400 italic">
                      {editingEmail ? "Confidencial" : "Padrão: 123456"}
                    </div>
                  </div>
               </div>
               
               <div className="pt-6 border-t border-gray-100">
                  <button type="submit" className="w-full bg-[#8B1B1F] text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-[#6F0F14] transition-all hover:scale-[1.01] active:scale-95">
                    <Save size={20} /> {editingEmail ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersView;
