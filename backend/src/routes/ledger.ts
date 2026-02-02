import { Router, Request, Response } from 'express';
import pool from '../database';

const router = Router();

// Listar histórico de pontuação
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.query;
    
    let query = 'SELECT * FROM score_ledger';
    const params: any[] = [];
    
    if (userEmail) {
      query += ' WHERE user_email = ?';
      params.push(userEmail);
    }
    
    query += ' ORDER BY data DESC';
    
    const [rows] = await pool.execute(query, params);
    
    const ledger = (rows as any[]).map(l => ({
      ID: l.id,
      UserEmail: l.user_email,
      Data: l.data,
      Pontos: l.pontos,
      Tipo: l.tipo,
      Descricao: l.descricao,
      TaskID: l.task_id
    }));
    
    res.json(ledger);
  } catch (error) {
    console.error('Erro ao listar ledger:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Resumo de pontos por usuário
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        user_email,
        SUM(CASE WHEN pontos > 0 THEN pontos ELSE 0 END) as ganhos,
        SUM(CASE WHEN pontos < 0 THEN pontos ELSE 0 END) as penalidades,
        SUM(pontos) as total
      FROM score_ledger
      WHERE MONTH(data) = MONTH(CURRENT_DATE()) AND YEAR(data) = YEAR(CURRENT_DATE())
      GROUP BY user_email
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
