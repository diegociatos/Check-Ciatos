import { Router, Request, Response } from 'express';
import pool from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Listar todos os templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM task_templates ORDER BY titulo
    `);
    
    const templates = (rows as any[]).map(t => ({
      ID: t.id,
      Titulo: t.titulo,
      Descricao: t.descricao,
      Responsavel: t.responsavel,
      Prioridade: t.prioridade,
      PontosValor: t.pontos_valor,
      Recorrencia: t.recorrencia,
      DiasRecorrencia: t.dias_recorrencia ? t.dias_recorrencia.split(',') : [],
      DiaDoMes: t.dia_mes,
      DataInicio: t.data_inicio,
      HoraLimite: t.hora_limite,
      Ativa: t.ativa ? true : false,
      CriadoPor: t.criado_por,
      UltimaExecucao: t.ultima_execucao
    }));
    
    res.json(templates);
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Criar template
router.post('/', async (req: Request, res: Response) => {
  try {
    const { Titulo, Descricao, Responsavel, Prioridade, PontosValor, Recorrencia, DiasRecorrencia, DiaDoMes, DataInicio, HoraLimite, CriadoPor } = req.body;
    
    if (!Titulo || !Responsavel) {
      return res.status(400).json({ error: 'Título e Responsável são obrigatórios.' });
    }
    
    const id = uuidv4();
    const diasStr = Array.isArray(DiasRecorrencia) ? DiasRecorrencia.join(',') : null;
    
    await pool.execute(`
      INSERT INTO task_templates (id, titulo, descricao, responsavel, prioridade, pontos_valor, recorrencia, dias_recorrencia, dia_mes, data_inicio, hora_limite, ativa, criado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)
    `, [id, Titulo, Descricao || null, Responsavel, Prioridade || 'MEDIA', PontosValor || 10, Recorrencia || 'NENHUMA', diasStr, DiaDoMes || null, DataInicio || null, HoraLimite || null, CriadoPor || null]);
    
    res.status(201).json({
      ID: id,
      Titulo,
      Descricao,
      Responsavel,
      Prioridade: Prioridade || 'MEDIA',
      PontosValor: PontosValor || 10,
      Recorrencia: Recorrencia || 'NENHUMA',
      DiasRecorrencia: DiasRecorrencia || [],
      DiaDoMes,
      DataInicio,
      HoraLimite,
      Ativa: true,
      CriadoPor
    });
    
  } catch (error: any) {
    console.error('Erro ao criar template:', error);
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Usuário responsável não encontrado.' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Toggle template ativo/inativo
router.post('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute('SELECT ativa FROM task_templates WHERE id = ?', [id]);
    const templates = rows as any[];
    
    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template não encontrado.' });
    }
    
    const newStatus = !templates[0].ativa;
    
    await pool.execute('UPDATE task_templates SET ativa = ? WHERE id = ?', [newStatus, id]);
    
    res.json({ message: 'Status alterado com sucesso!', ativa: newStatus });
    
  } catch (error) {
    console.error('Erro ao alternar status do template:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Gerar tarefa a partir de template
router.post('/:id/generate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { force } = req.body;
    
    const [rows] = await pool.execute('SELECT * FROM task_templates WHERE id = ?', [id]);
    const templates = rows as any[];
    
    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template não encontrado.' });
    }
    
    const tmpl = templates[0];
    const todayStr = new Date().toISOString().split('T')[0];
    
    const [existingTasks] = await pool.execute(`
      SELECT id FROM tasks 
      WHERE titulo = ? AND responsavel = ? AND DATE(data_limite) = ?
    `, [tmpl.titulo, tmpl.responsavel, todayStr]);
    
    if ((existingTasks as any[]).length > 0 && !force) {
      return res.status(409).json({ 
        duplicate: true, 
        template: {
          ID: tmpl.id,
          Titulo: tmpl.titulo,
          Responsavel: tmpl.responsavel
        }
      });
    }
    
    const taskId = uuidv4();
    // Use Brazil timezone (UTC-3) for due date
    const now = new Date();
    const brazilOffset = -3 * 60; // UTC-3 in minutes
    const localTime = new Date(now.getTime() + (brazilOffset - now.getTimezoneOffset()) * 60000);
    const dueDate = new Date(localTime.getFullYear(), localTime.getMonth(), localTime.getDate(), 23, 59, 59, 999);
    
    await pool.execute(`
      INSERT INTO tasks (id, template_id, titulo, descricao, responsavel, data_limite, prioridade, pontos_valor, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE')
    `, [taskId, tmpl.id, tmpl.titulo, tmpl.descricao, tmpl.responsavel, dueDate, tmpl.prioridade, tmpl.pontos_valor]);
    
    await pool.execute('UPDATE task_templates SET ultima_execucao = NOW() WHERE id = ?', [id]);
    
    res.status(201).json({
      message: `Tarefa "\${tmpl.titulo}" gerada com sucesso.`,
      task: {
        ID: taskId,
        TemplateID: tmpl.id,
        Titulo: tmpl.titulo,
        Descricao: tmpl.descricao,
        Responsavel: tmpl.responsavel,
        DataLimite: dueDate.toISOString(),
        Prioridade: tmpl.prioridade,
        PontosValor: tmpl.pontos_valor,
        Status: 'PENDENTE'
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Deletar template
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM task_templates WHERE id = ?', [id]);
    
    res.json({ message: 'Template excluído com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao excluir template:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
