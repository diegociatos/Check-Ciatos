import React, { useRef, useState } from 'react';
import { User } from '../types.ts';
import { Save, Camera, Mail, Briefcase, Trash2, Loader2 } from 'lucide-react';
import { showToast } from './ui';

interface MyProfileViewProps {
  user: User;
  onUpdate: (data: Partial<User>) => void;
}

// Redimensiona a imagem no navegador e devolve um data URL leve (JPEG ~256px).
const lerImagemRedimensionada = (file: File, max = 256): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * escala);
        const h = Math.round(img.height * escala);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Não foi possível processar a imagem.'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Imagem inválida.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });

const MyProfileView: React.FC<MyProfileViewProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    Nome: user.Nome,
    Telefone: user.Telefone || '',
    DataNascimento: user.DataNascimento || '',
    Endereco: user.Endereco || '',
    Bio: user.Bio || '',
    Foto: user.Foto || '',
  });
  const [salvando, setSalvando] = useState(false);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const escolherFoto = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast({ message: 'Selecione um arquivo de imagem.', tone: 'erro' }); return; }
    if (file.size > 8 * 1024 * 1024) { showToast({ message: 'Imagem muito grande (máx. 8MB).', tone: 'erro' }); return; }
    setProcessandoFoto(true);
    try {
      const dataUrl = await lerImagemRedimensionada(file);
      setFormData((f) => ({ ...f, Foto: dataUrl }));
    } catch (e: any) {
      showToast({ message: e?.message || 'Não foi possível carregar a imagem.', tone: 'erro' });
    } finally {
      setProcessandoFoto(false);
    }
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      await onUpdate(formData);
      showToast({ message: 'Perfil atualizado.', tone: 'sucesso' });
    } catch (e: any) {
      showToast({ message: e?.message || 'Não foi possível salvar.', tone: 'erro' });
    } finally {
      setSalvando(false);
    }
  };

  const inputCls = 'w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-tinta outline-none focus:ring-2 focus:ring-marca/20';
  const labelCls = 'block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Cabeçalho com avatar */}
      <div className="bg-marca rounded-2xl text-white p-8 shadow-[0_10px_30px_rgba(107,61,30,0.12)] flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <div className="h-28 w-28 bg-white rounded-2xl flex items-center justify-center text-marca font-titulo text-4xl shadow-lg overflow-hidden">
            {formData.Foto ? <img src={formData.Foto} alt="Foto" className="w-full h-full object-cover" /> : user.Nome.charAt(0)}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={processandoFoto}
            className="absolute -bottom-2 -right-2 p-2.5 bg-white text-marca rounded-xl shadow-lg hover:scale-110 transition-transform disabled:opacity-60"
            title="Trocar foto"
          >
            {processandoFoto ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => escolherFoto(e.target.files?.[0] ?? null)} />
        </div>
        <div className="text-center sm:text-left">
          <h1 className="font-titulo text-3xl">{formData.Nome || user.Nome}</h1>
          <p className="text-white/70 flex items-center justify-center sm:justify-start gap-2 mt-1">
            <Briefcase size={16} /> {user.Role}{user.Time ? ` · ${user.Time}` : ''}
          </p>
          {formData.Foto && (
            <button onClick={() => setFormData((f) => ({ ...f, Foto: '' }))} className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white">
              <Trash2 size={13} /> Remover foto
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados editáveis */}
        <div className="lg:col-span-2 bg-superficie p-8 rounded-2xl border border-stone-200 shadow-[0_1px_2px_rgba(28,25,23,0.04)] space-y-6">
          <h2 className="font-titulo text-xl text-tinta">Informações pessoais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Nome completo</label>
              <input className={inputCls} value={formData.Nome} onChange={(e) => setFormData({ ...formData, Nome: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Telefone / WhatsApp</label>
              <input className={inputCls} value={formData.Telefone} onChange={(e) => setFormData({ ...formData, Telefone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className={labelCls}>Data de nascimento</label>
              <input type="date" className={inputCls} value={formData.DataNascimento} onChange={(e) => setFormData({ ...formData, DataNascimento: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Endereço</label>
              <input className={inputCls} value={formData.Endereco} onChange={(e) => setFormData({ ...formData, Endereco: e.target.value })} placeholder="Rua, nº, cidade" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Sobre você <span className="text-stone-300 normal-case">(opcional)</span></label>
              <textarea className={`${inputCls} min-h-[90px]`} value={formData.Bio} onChange={(e) => setFormData({ ...formData, Bio: e.target.value })} placeholder="Um resumo do seu perfil, função ou responsabilidades." />
            </div>
          </div>
          <button
            onClick={salvar}
            disabled={salvando}
            className="w-full inline-flex items-center justify-center gap-2 bg-marca text-white py-3.5 rounded-xl font-semibold hover:bg-marca-escuro transition-colors active:scale-[0.99] disabled:opacity-60"
          >
            {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar alterações
          </button>
        </div>

        {/* Conta */}
        <div className="space-y-6">
          <div className="bg-superficie p-6 rounded-2xl border border-stone-200 shadow-[0_1px_2px_rgba(28,25,23,0.04)] space-y-4">
            <h2 className="font-titulo text-lg text-tinta">Conta</h2>
            <div>
              <label className={labelCls}>E-mail de acesso</label>
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5">
                <Mail size={16} className="text-stone-400 shrink-0" />
                <span className="text-sm text-stone-600 truncate">{user.Email}</span>
              </div>
              <p className="text-xs text-stone-400 mt-1.5">É o seu login. Para trocar, peça ao responsável da sua empresa (é uma alteração feita com segurança pela administração).</p>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700">{user.Status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfileView;
