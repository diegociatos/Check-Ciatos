
import React, { useState } from 'react';
import { User } from '../types.ts';
import { User as UserIcon, Save, Camera, Mail, Phone, MapPin, Briefcase } from 'lucide-react';

interface MyProfileViewProps {
  user: User;
  onUpdate: (data: Partial<User>) => void;
}

const MyProfileView: React.FC<MyProfileViewProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    Nome: user.Nome,
    Telefone: user.Telefone || '',
    Bio: user.Bio || '',
    Endereco: user.Endereco || ''
  });

  const handleSave = () => {
    onUpdate(formData);
    alert("Perfil atualizado com sucesso!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 font-ciatos">
      <div className="bg-[#8B1B1F] p-12 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="h-32 w-32 bg-white rounded-3xl flex items-center justify-center text-[#8B1B1F] text-4xl font-black shadow-xl overflow-hidden">
              {user.Foto ? <img src={user.Foto} className="w-full h-full object-cover" /> : user.Nome.charAt(0)}
            </div>
            <button className="absolute -bottom-2 -right-2 p-3 bg-white text-[#8B1B1F] rounded-2xl shadow-lg hover:scale-110 transition-transform">
              <Camera size={20} />
            </button>
          </div>
          <div>
            <h2 className="text-4xl font-bold uppercase tracking-tight">{user.Nome}</h2>
            <p className="text-white/60 font-medium text-lg flex items-center gap-2">
              <Briefcase size={18} /> {user.Role} • {user.Time}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
          <h3 className="text-xl font-bold text-[#111111] uppercase tracking-tighter">Informações Básicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome Completo</label>
              <input 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#8B1B1F]/10"
                value={formData.Nome}
                onChange={e => setFormData({...formData, Nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefone / WhatsApp</label>
              <input 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#8B1B1F]/10"
                value={formData.Telefone}
                onChange={e => setFormData({...formData, Telefone: e.target.value})}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Endereço Residencial</label>
              <input 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#8B1B1F]/10"
                value={formData.Endereco}
                onChange={e => setFormData({...formData, Endereco: e.target.value})}
              />
            </div>
          </div>
          <button 
            onClick={handleSave}
            className="w-full bg-[#8B1B1F] text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-[#6F0F14] transition-all"
          >
            <Save size={20} /> Salvar Alterações
          </button>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#111111] uppercase tracking-tighter">Dados de Conta</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <Mail size={18} className="text-gray-400" />
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase">E-mail Corporativo</p>
                  <p className="font-bold text-gray-700">{user.Email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <UserIcon size={18} className="text-gray-400" />
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase">Status do Perfil</p>
                  <p className="font-bold text-green-600 uppercase text-xs">{user.Status}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfileView;
