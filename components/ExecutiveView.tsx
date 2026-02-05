
import React, { useState, useMemo } from 'react';
import { Task, User, TaskStatus, UserRole } from '../types';
import { getTodayStr, toDateOnly } from '../store';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  HeartPulse, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Filter, 
  Calendar,
  ChevronDown
} from 'lucide-react';

interface ExecutiveViewProps {
  tasks: Task[];
  users: User[];
}

type Period = 'Hoje' | 'Esta Semana' | 'Este Mês';

const ExecutiveView: React.FC<ExecutiveViewProps> = ({ tasks, users }) => {
  const [selectedGestor, setSelectedGestor] = useState<string>('TODOS');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Este Mês');

  const gestores = users.filter(u => u.Role === UserRole.GESTOR || u.Role === UserRole.ADMIN);

  // Filtro de Período respeitando America/Sao_Paulo
  const filterByPeriod = (date: string | undefined) => {
    if (!date) return false;
    const taskDateStr = toDateOnly(date);
    const todayStr = getTodayStr();
    
    if (selectedPeriod === 'Hoje') {
      return taskDateStr === todayStr;
    }
    
    if (selectedPeriod === 'Esta Semana') {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const tDate = new Date(taskDateStr + 'T12:00:00'); // Midday to avoid boundary shifts
      return tDate >= startOfWeek;
    }
    
    if (selectedPeriod === 'Este Mês') {
      const now = new Date();
      const parts = taskDateStr.split('-');
      return parseInt(parts[1]) === (now.getMonth() + 1) && parseInt(parts[0]) === now.getFullYear();
    }
    
    return true;
  };

  // Filtragem Global baseada nos Seletores
  const filteredTasks = useMemo(() => {
    let list = tasks.filter(t => filterByPeriod(t.DataLimite));
    
    if (selectedGestor !== 'TODOS') {
      list = list.filter(t => {
        const user = users.find(u => u.Email === t.Responsavel);
        return user?.Gestor === selectedGestor;
      });
    }
    return list;
  }, [tasks, selectedGestor, selectedPeriod, users]);

  const filteredUsers = useMemo(() => {
    if (selectedGestor === 'TODOS') return users.filter(u => u.Role === UserRole.COLABORADOR);
    return users.filter(u => u.Gestor === selectedGestor);
  }, [users, selectedGestor]);

  // Card 1: Saúde Geral
  const completionRate = useMemo(() => {
    const total = filteredTasks.length;
    if (total === 0) return 0;
    // Fix: Mapped CONCLUIDO/CONFERIDO to APROVADA
    const completed = filteredTasks.filter(t => t.Status === TaskStatus.APROVADA).length;
    return (completed / total) * 100;
  }, [filteredTasks]);

  // Card 2: Alerta de Crise
  const overdueTotal = useMemo(() => {
    const today = getTodayStr();
    return tasks.filter(t => 
      t.Status === TaskStatus.PENDENTE && 
      t.DataLimite_Date! < today &&
      (selectedGestor === 'TODOS' || users.find(u => u.Email === t.Responsavel)?.Gestor === selectedGestor)
    ).length;
  }, [tasks, selectedGestor, users]);

  // Card 3: Ranking de Gestores
  const managerRanking = useMemo(() => {
    const data = gestores.map(g => {
      const team = users.filter(u => u.Gestor === g.Email);
      if (team.length === 0) return { nome: g.Nome, eficiencia: 0, count: 0 };
      const avgEficiencia = team.reduce((acc, u) => acc + (u.EficienciaMes || 0), 0) / team.length;
      return { nome: g.Nome, eficiencia: avgEficiencia, count: team.length };
    }).filter(g => g.count > 0).sort((a, b) => b.eficiencia - a.eficiencia);
    
    return data;
  }, [gestores, users]);

  // Card 4: Volume de Entregas
  const chartData = useMemo(() => {
    const days = [];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(d);

      const count = tasks.filter(t => 
        t.DataConclusao?.startsWith(dateStr) && 
        (selectedGestor === 'TODOS' || users.find(u => u.Email === t.Responsavel)?.Gestor === selectedGestor)
      ).length;
      days.push({ name: dayNames[d.getDay()], count });
    }
    return days;
  }, [tasks, selectedGestor, users]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Filtros Estratégicos */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest flex items-center gap-2">
            <Users size={12} /> Equipe do Gestor
          </label>
          <div className="relative">
            <select 
              className="w-full bg-[#F3F3F3] border-none rounded-2xl p-4 text-sm font-bold outline-none appearance-none cursor-pointer"
              value={selectedGestor}
              onChange={e => setSelectedGestor(e.target.value)}
            >
              <option value="TODOS">Todas as Equipes (Visão Consolidada)</option>
              {gestores.map(g => <option key={g.Email} value={g.Email}>{g.Nome}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="w-full md:w-64 space-y-2">
          <label className="text-[10px] font-black text-[#8B1B1F] uppercase tracking-widest flex items-center gap-2">
            <Calendar size={12} /> Período de Análise
          </label>
          <div className="flex bg-[#F3F3F3] rounded-2xl p-1">
            {(['Hoje', 'Esta Semana', 'Este Mês'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                  selectedPeriod === p ? 'bg-[#8B1B1F] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card 1: Saúde Geral */}
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-between h-64">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Saúde Geral Empresa</h3>
            <HeartPulse size={24} className="text-green-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-6xl font-black text-[#8B1B1F] tracking-tighter">{completionRate.toFixed(1)}%</span>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Obrigações Concluídas vs Possíveis</p>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        {/* Card 2: Alerta de Crise */}
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-between h-64">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Alerta de Crise</h3>
            <AlertTriangle size={24} className={overdueTotal > 0 ? 'text-red-600 animate-pulse' : 'text-gray-200'} />
          </div>
          <div className="flex flex-col">
            <span className={`text-6xl font-black tracking-tighter ${overdueTotal > 0 ? 'text-red-600' : 'text-gray-300'}`}>{overdueTotal}</span>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Tarefas Atrasadas Atualmente</p>
          </div>
          <div className={`mt-4 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center ${overdueTotal > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {overdueTotal > 0 ? 'Intervenção Necessária' : 'Operação Estável'}
          </div>
        </div>

        {/* Card 4: Volume de Entregas */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col h-64">
          <h3 className="text-lg font-ciatos font-bold text-[#111111] uppercase tracking-tighter mb-6">Volume de Entregas</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" hide />
                <Tooltip 
                  cursor={{fill: '#F3F3F3'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#8B1B1F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center mt-2">Sazonalidade (Últimos 7 dias)</p>
        </div>
      </div>

      {/* Card 3: Ranking de Gestores */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-ciatos font-bold text-[#111111] uppercase tracking-tighter">Performance de Gestão por Equipe</h3>
          <TrendingUp size={20} className="text-[#8B1B1F]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gestor</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Time</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Eficiência Média</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {managerRanking.map((mgr, i) => (
                <tr key={mgr.nome} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-300">{i + 1}º</span>
                      <span className="text-sm font-bold text-[#111111]">{mgr.nome}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center text-gray-500 font-bold text-xs">{mgr.count} Colab.</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`text-sm font-black ${mgr.eficiencia > 80 ? 'text-green-600' : mgr.eficiencia > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {mgr.eficiencia.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${
                      mgr.eficiencia > 85 ? 'bg-green-100 text-green-700' : 
                      mgr.eficiencia > 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {mgr.eficiencia > 85 ? 'Alta Performance' : mgr.eficiencia > 70 ? 'Atenção' : 'Risco Operacional'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveView;
