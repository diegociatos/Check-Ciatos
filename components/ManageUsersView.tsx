
import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { Plus, Trash2, Edit3, Lock, Shield, Mail, UserCheck, X, Save, User as UserIcon, ShieldX, UserMinus, RefreshCw, UserRoundSearch } from 'lucide-react';

interface ManageUsersViewProps {
  users: User[];
  onAddUser: (user: Partial<User>) => void;
  onUpdateUser: (email: string, user: Partial<User>) => void;
  onResetPassword: (email: string) => void;
  onToggleStatus: (email: string) => void;
  onDeleteUser: (email: string) => void;
}

const ManageUsersView: React.FC<ManageUsersViewProps> = ({ users, onAddUser, onUpdateUser, onResetPassword, onToggleStatus, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    Nome: '', Email: '', Role: UserRole.COLABORADOR, Time: '', Telefone: '', DataNascimento: '', Gestor: ''
  });

  const gestores = users.filter(u => u.Role === UserRole.GESTOR || u.Role === UserRole.ADMIN);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.Email?.includes('@')) throw new Error("E-mail inválido.");
      if (formData.Role === UserRole.COLABORADOR && !formData.Gestor) throw new Error("Todo colaborador deve ter um Gestor Responsável.");
      
      if (editingEmail) {
        onUpdateUser(editingEmail, formData);
      } else {
        onAddUser(formData);
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setEditingEmail(null);
    setFormData({ Nome: '', Email: '', Role: UserRole.COLABORADOR, Time: '', Telefone: '', DataNascimento: '', Gestor: '' });
  };

  const openEdit = (user: User) => {
    setEditingEmail(user.Email);
    setFormData({ ...user });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-ciatos font-bold text-[#6F0F14] uppercase">Gestão de Usuários</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Administração Master de Equipes Grupo Ciatos</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 bg-[#8B1B1F] text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase shadow-xl hover:scale-105 transition-all">
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role / Gestor</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-bold">
              {users.map(user => (
                <tr key={user.Email} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-[#8B1B1F] rounded-full flex items-center justify-center text-white text-sm">
                        {user.Nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[#111111]">{user.Nome}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{user.Email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#111111] uppercase tracking-tighter">{user.Role}</span>
                      {user.Role === UserRole.COLABORADOR && (
                         <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1">
                           <UserRoundSearch size={10} /> Gestor: {users.find(u => u.Email === user.Gestor)?.Nome || user.Gestor || '---'}
                         </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      user.Status === UserStatus.ATIVO ? 'bg-green-50 text-green-600 border-green-100' :
                      user.Status === UserStatus.BLOQUEADO ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-gray-50 text-gray-400 border-gray-100'
                    }`}>
                      {user.Status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(user)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all" title="Editar">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => onResetPassword(user.Email)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Resetar Senha">
                      <Lock size={16} />
                    </button>
                    <button onClick={() => onToggleStatus(user.Email)} className={`p-2 rounded-xl transition-all ${user.Status === UserStatus.ATIVO ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                      {user.Status === UserStatus.ATIVO ? <UserMinus size={16} /> : <UserCheck size={16} />}
                    </button>
                    <button onClick={() => onDeleteUser(user.Email)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50">
               <h3 className="text-xl font-ciatos font-bold text-[#111111] uppercase">{editingEmail ? 'Editar Usuário' : 'Novo Usuário Corporativo'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-gray-500"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Nome} onChange={e => setFormData({...formData, Nome: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail Corporativo</label>
                    <input required type="email" readOnly={!!editingEmail} className={`w-full border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none ${editingEmail ? 'bg-gray-100' : 'bg-gray-50'}`} value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Role / Cargo</label>
                    <select required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Role} onChange={e => setFormData({...formData, Role: e.target.value as UserRole})}>
                      <option value={UserRole.COLABORADOR}>Colaborador</option>
                      <option value={UserRole.GESTOR}>Gestor</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                  </div>
                  
                  {formData.Role === UserRole.COLABORADOR && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest">Gestor Responsável *</label>
                      <select required className="w-full bg-white border-2 border-[#8B1B1F]/20 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Gestor} onChange={e => setFormData({...formData, Gestor: e.target.value})}>
                        <option value="">Selecione o Gestor...</option>
                        {gestores.map(g => <option key={g.Email} value={g.Email}>{g.Nome}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time / Departamento</label>
                    <input required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Time} onChange={e => setFormData({...formData, Time: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefone</label>
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none" value={formData.Telefone} onChange={e => setFormData({...formData, Telefone: e.target.value})} />
                  </div>
               </div>
               <button type="submit" className="w-full bg-[#8B1B1F] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-[#6F0F14] transition-colors">
                  <Save size={20} /> {editingEmail ? 'Atualizar Usuário' : 'Cadastrar e Enviar Acesso'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersView;
