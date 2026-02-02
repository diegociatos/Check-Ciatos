import { Router, Request, Response } from 'express';
import pool from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Listar todas as tarefas
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM tasks ORDER BY data_limite DESC
    `);
    
    const tasks = (rows as any[]).map(t => ({
      ID: t.id,
      TemplateID: t.template_id,
      Titulo: t.titulo,
      Descricao: t.descricao,
      Responsavel: t.responsavel,
      DataLimite: t.data_limite,
      Prioridade: t.prioridade,
      PontosValor: t.pontos_valor,
      Status: t.status,
      DataConclusao: t.data_conclusao,
      CompletionNote: t.completion_note,
      ProofAttachment: t.proof_attachment,
      ConferenciaStatus: t.conferencia_status,
      ObservacaoGestor: t.observacao_gestor
    }));
    
    res.json(tasks);
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Criar tarefa
router.post('/', async (req: Request, res: Response) => {
  try {
    const { Titulo, Descricao, Responsavel, DataLimite, Prioridade, PontosValor, TemplateID } = req.body;
    
    const id = uuidv4();
    
    await pool.execute(`
      INSERT INTO tasks (id, template_id, titulo, descricao, responsavel, data_limite, prioridade, pontos_valor, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE')
    `, [id, TemplateID || null, Titulo, Descricao || null, Responsavel, DataLimite, Prioridade || 'MEDIA', PontosValor || 10]);
    
    res.status(201).json({
      ID: id,
      TemplateID,
      Titulo,
      Descricao,
      Responsavel,
      DataLimite,
      Prioridade: Prioridade || 'MEDIA',
      PontosValor: PontosValor || 10,
      Status: 'PENDENTE'
    });
    
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Completar tarefa
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note, proof } = req.body;
    
    await pool.execute(`
      UPDATE tasks 
      SET status = 'CONCLUIDO', data_conclusao = NOW(), completion_note = ?, proof_attachment = ?
      WHERE id = ?
    `, [note || null, proof || null, id]);
    
    res.json({ message: 'Tarefa concluída com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao completar tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Conferir tarefa (audit)
router.post('/:id/audit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, observation } = req.body;
    
    // Buscar tarefa
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
    const tasks = rows as any[];
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }
    
    const task = tasks[0];
    
    // Calcular pontos
    let delta = 0;
    let motive = '';
    
    if (status === 'APROVADO') {
      delta = task.pontos_valor;
      motive = `Aprovação: ${task.titulo}`;
    } else if (status === 'NAO_CUMPRIU') {
      delta = -5 * task.pontos_valor;
      motive = `Não Cumpre: ${task.titulo}`;
    } else {
      delta = -3 * task.pontos_valor;
      motive = `Erro Execução: ${task.titulo}`;
    }
    
    // Atualizar tarefa
    await pool.execute(`
      UPDATE tasks 
      SET status = 'CONFERIDO', conferencia_status = ?, observacao_gestor = ?
      WHERE id = ?
    `, [status, observation || null, id]);
    
    // Registrar no ledger
    const ledgerId = uuidv4();
    const tipo = delta >= 0 ? 'GANHO' : 'PENALIDADE';
    
    await pool.execute(`
      INSERT INTO score_ledger (id, user_email, data, pontos, tipo, descricao, task_id)
      VALUES (?, ?, NOW(), ?, ?, ?, ?)
    `, [ledgerId, task.responsavel, delta, tipo, motive, id]);
    
    res.json({ message: 'Tarefa conferida com sucesso!', pontos: delta });
    
  } catch (error) {
    console.error('Erro ao conferir tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Deletar tarefa
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
    
    res.json({ message: 'Tarefa excluída com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
