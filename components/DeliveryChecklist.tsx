
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle, XCircle, AlertCircle, Clock, User, Send, Calendar, ShieldCheck, History } from 'lucide-react';

interface DeliveryChecklistProps {
  tasks: Task[];
  onAudit: (taskId: string, status: TaskStatus, justification: string, nextDeadline?: string) => void;
}

const DeliveryChecklist: React.FC<DeliveryChecklistProps> = ({ tasks, onAudit }) => {
  const [auditTask, setAuditTask] = useState<Task | null>(null);
  const [justification, setJustification] = useState('');
  const [nextDeadline, setNextDeadline] = useState('');
  const [actionType, setActionType] = useState<TaskStatus | null>(null);

  const pendingAudit = tasks.filter(t => t.Status === TaskStatus.AGUARDANDO_APROVACAO);

  const handleAuditAction = () => {
    if (!auditTask || !actionType) return;
    if (actionType !== TaskStatus.APROVADA) {
      if (!justification.trim()) return alert("A justificativa é obrigatória.");
      if (!nextDeadline) return alert("Defina um novo prazo.");
    }
    onAudit(auditTask.ID, actionType, justification, nextDeadline);
    setAuditTask(null);
    setJustification('');
    setNextDeadline('');
    setActionType(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-ciatos pb-20">
      <div className="flex flex-col gap-2">
         <h3 className="text-3xl font-bold text-[#8B1B1F] uppercase tracking-tighter">Conferir Entregas</h3>
         <p className="text-sm text-gray-400 font-medium">Validação técnica das obrigações da equipe.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingAudit.length > 0 ? (
          pendingAudit.map(task => (
            <div key={task.ID} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
               <div className="p-8 flex-1 space-y-6">
                  <div className="flex justify-between items-start">
                     <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        Aguardando Auditoria
                     </div>
                     <span className="text-2xl font-black text-[#8B1B1F] tracking-tighter">{task.PontosValor} pts</span>
                  </div>
                  
                  <div>
                     <h4 className="text-xl font-bold text-[#111111] leading-tight mb-2">{task.Titulo}</h4>
                     <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        <User size={12} /> {task.Responsavel}
                     </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-50">
                     <div className="flex items-center gap-3">
                        <Clock size={16} className="text-green-600" />
                        <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase">Concluído em</p>
                           <p className="text-xs font-bold text-[#111111]">{new Date(task.Data