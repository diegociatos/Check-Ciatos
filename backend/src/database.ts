import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'check_ciatos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;

export async function initializeDatabase() {
  const connection = await pool.getConnection();
  
  try {
    // Tabela de usuários
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'GESTOR', 'COLABORADOR') NOT NULL DEFAULT 'COLABORADOR',
        status ENUM('ATIVO', 'INATIVO', 'BLOQUEADO') NOT NULL DEFAULT 'ATIVO',
        time VARCHAR(100),
        gestor VARCHAR(255),
        senha VARCHAR(255) NOT NULL,
        senha_provisoria BOOLEAN DEFAULT TRUE,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultimo_acesso DATETIME,
        tentativas_falhadas INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (gestor) REFERENCES users(email) ON DELETE SET NULL
      )
    `);

    // Tabela de templates de tarefas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS task_templates (
        id VARCHAR(36) PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        responsavel VARCHAR(255) NOT NULL,
        prioridade ENUM('BAIXA', 'MEDIA', 'ALTA', 'URGENTE') NOT NULL DEFAULT 'MEDIA',
        pontos_valor INT NOT NULL DEFAULT 10,
        recorrencia ENUM('NENHUMA', 'DIARIA', 'SEMANAL', 'MENSAL') NOT NULL DEFAULT 'NENHUMA',
        dia_semana INT,
        dia_mes INT,
        hora_limite TIME,
        ativa BOOLEAN DEFAULT TRUE,
        criado_por VARCHAR(255),
        ultima_execucao DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (responsavel) REFERENCES users(email) ON DELETE CASCADE,
        FOREIGN KEY (criado_por) REFERENCES users(email) ON DELETE SET NULL
      )
    `);

    // Tabela de tarefas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(36) PRIMARY KEY,
        template_id VARCHAR(36),
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        responsavel VARCHAR(255) NOT NULL,
        data_limite DATETIME NOT NULL,
        prioridade ENUM('BAIXA', 'MEDIA', 'ALTA', 'URGENTE') NOT NULL DEFAULT 'MEDIA',
        pontos_valor INT NOT NULL DEFAULT 10,
        status ENUM('PENDENTE', 'CONCLUIDO', 'CONFERIDO', 'ATRASADA') NOT NULL DEFAULT 'PENDENTE',
        data_conclusao DATETIME,
        completion_note TEXT,
        proof_attachment TEXT,
        conferencia_status ENUM('APROVADO', 'ERRO_EXECUCAO', 'NAO_CUMPRIU'),
        observacao_gestor TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES task_templates(id) ON DELETE SET NULL,
        FOREIGN KEY (responsavel) REFERENCES users(email) ON DELETE CASCADE
      )
    `);

    // Tabela de histórico de pontuação (ledger)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS score_ledger (
        id VARCHAR(36) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        data DATETIME NOT NULL,
        pontos INT NOT NULL,
        tipo ENUM('GANHO', 'PENALIDADE') NOT NULL,
        descricao TEXT,
        task_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
      )
    `);

    // Verificar se existe usuário admin, senão criar
    const [adminRows] = await connection.execute(
      'SELECT email FROM users WHERE role = ?',
      ['ADMIN']
    );

    if ((adminRows as any[]).length === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('250500', 10);
      
      await connection.execute(`
        INSERT INTO users (email, nome, role, status, time, senha, senha_provisoria, data_criacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, ['diego.garcia@grupociatos.com.br', 'Diego Garcia', 'ADMIN', 'ATIVO', 'Gestão', hashedPassword, false]);
      
      console.log('✅ Usuário admin criado: diego.garcia@grupociatos.com.br');
    }

    console.log('✅ Banco de dados inicializado com sucesso!');
  } finally {
    connection.release();
  }
}
