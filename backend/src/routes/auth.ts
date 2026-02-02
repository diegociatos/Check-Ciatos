import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );
    
    const users = rows as any[];
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    const user = users[0];
    
    if (user.status === 'BLOQUEADO') {
      return res.status(403).json({ error: 'Conta bloqueada por excesso de tentativas. Contate o suporte.' });
    }
    
    if (user.status === 'INATIVO') {
      return res.status(403).json({ error: 'Conta desativada.' });
    }
    
    const senhaValida = await bcrypt.compare(senha, user.senha);
    
    if (!senhaValida) {
      const newAttempts = (user.tentativas_falhadas || 0) + 1;
      const newStatus = newAttempts >= 5 ? 'BLOQUEADO' : user.status;
      
      await pool.execute(
        'UPDATE users SET tentativas_falhadas = ?, status = ? WHERE email = ?',
        [newAttempts, newStatus, user.email]
      );
      
      if (newStatus === 'BLOQUEADO') {
        return res.status(403).json({ error: 'Conta bloqueada após 5 tentativas incorretas.' });
      }
      
      return res.status(401).json({ error: `Senha incorreta. Tentativa ${newAttempts} de 5.` });
    }
    
    // Sucesso - resetar tentativas e atualizar último acesso
    await pool.execute(
      'UPDATE users SET tentativas_falhadas = 0, ultimo_acesso = NOW() WHERE email = ?',
      [user.email]
    );
    
    res.json({
      Email: user.email,
      Nome: user.nome,
      Role: user.role,
      Status: user.status,
      Time: user.time,
      Gestor: user.gestor,
      SenhaProvisoria: user.senha_provisoria,
      DataCriacao: user.data_criacao,
      UltimoAcesso: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Alterar senha
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { email, senhaAtual, novaSenha } = req.body;
    
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows as any[];
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    const user = users[0];
    const senhaValida = await bcrypt.compare(senhaAtual, user.senha);
    
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }
    
    if (novaSenha.length < 8 || !/\d/.test(novaSenha)) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres e conter pelo menos um número.' });
    }
    
    const senhaIgual = await bcrypt.compare(novaSenha, user.senha);
    if (senhaIgual) {
      return res.status(400).json({ error: 'A nova senha não pode ser igual à antiga.' });
    }
    
    const hashedPassword = await bcrypt.hash(novaSenha, 10);
    
    await pool.execute(
      'UPDATE users SET senha = ?, senha_provisoria = FALSE WHERE email = ?',
      [hashedPassword, email]
    );
    
    res.json({ message: 'Senha alterada com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Listar todos os usuários
router.get('/users', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`
      SELECT email, nome, role, status, time, gestor, senha_provisoria, 
             data_criacao, ultimo_acesso, tentativas_falhadas
      FROM users
      ORDER BY nome
    `);
    
    const users = (rows as any[]).map(u => ({
      Email: u.email,
      Nome: u.nome,
      Role: u.role,
      Status: u.status,
      Time: u.time,
      Gestor: u.gestor,
      SenhaProvisoria: u.senha_provisoria,
      DataCriacao: u.data_criacao,
      UltimoAcesso: u.ultimo_acesso,
      TentativasFalhadas: u.tentativas_falhadas
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Criar usuário
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { Email, Nome, Role, Time, Gestor } = req.body;
    
    // Verificar se já existe
    const [existing] = await pool.execute('SELECT email FROM users WHERE email = ?', [Email]);
    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }
    
    const tempPass = '123456';
    const hashedPassword = await bcrypt.hash(tempPass, 10);
    
    await pool.execute(`
      INSERT INTO users (email, nome, role, status, time, gestor, senha, senha_provisoria, data_criacao)
      VALUES (?, ?, ?, 'ATIVO', ?, ?, ?, TRUE, NOW())
    `, [Email, Nome, Role || 'COLABORADOR', Time, Gestor || null, hashedPassword]);
    
    res.status(201).json({
      Email,
      Nome,
      Role: Role || 'COLABORADOR',
      Status: 'ATIVO',
      Time,
      Gestor,
      SenhaProvisoria: true,
      DataCriacao: new Date().toISOString(),
      TentativasFalhadas: 0,
      senhaProvisoria: tempPass
    });
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Atualizar usuário
router.put('/users/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const { Nome, Role, Time, Gestor, Status } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (Nome !== undefined) { updates.push('nome = ?'); values.push(Nome); }
    if (Role !== undefined) { updates.push('role = ?'); values.push(Role); }
    if (Time !== undefined) { updates.push('time = ?'); values.push(Time); }
    if (Gestor !== undefined) { updates.push('gestor = ?'); values.push(Gestor || null); }
    if (Status !== undefined) { updates.push('status = ?'); values.push(Status); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }
    
    values.push(email);
    
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE email = ?`,
      values
    );
    
    res.json({ message: 'Usuário atualizado com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Resetar senha do usuário
router.post('/users/:email/reset-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    const tempPass = '123456';
    const hashedPassword = await bcrypt.hash(tempPass, 10);
    
    await pool.execute(
      'UPDATE users SET senha = ?, senha_provisoria = TRUE, status = ?, tentativas_falhadas = 0 WHERE email = ?',
      [hashedPassword, 'ATIVO', email]
    );
    
    res.json({ message: 'Senha resetada com sucesso!', senhaProvisoria: tempPass });
    
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Toggle status do usuário
router.post('/users/:email/toggle-status', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    const [rows] = await pool.execute('SELECT status FROM users WHERE email = ?', [email]);
    const users = rows as any[];
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    const newStatus = users[0].status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    
    await pool.execute('UPDATE users SET status = ? WHERE email = ?', [newStatus, email]);
    
    res.json({ message: 'Status alterado com sucesso!', newStatus });
    
  } catch (error) {
    console.error('Erro ao alternar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Deletar usuário
router.delete('/users/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    await pool.execute('DELETE FROM users WHERE email = ?', [email]);
    
    res.json({ message: 'Usuário deletado com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
