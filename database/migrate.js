const db = require('../config/database');

const schemaSQL = `
-- Tabela de usuários (base para Módulo 1)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    funcao ENUM('Gerente', 'Colaborador') NOT NULL DEFAULT 'Colaborador',
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP NULL
);

-- Tabela de locais (Módulo 2)
CREATE TABLE IF NOT EXISTS locais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    capacidade_maxima DECIMAL(10,2),
    descricao TEXT,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de produtos (Módulo 2)
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2),
    unidade_medida VARCHAR(20) DEFAULT 'unidade',
    categoria VARCHAR(50),
    estoque_minimo DECIMAL(10,2) DEFAULT 0,
    fabricante VARCHAR(100),
    tipo ENUM('Matéria-prima', 'Produto semiacabado', 'Produto acabado') DEFAULT 'Matéria-prima',
    data_validade DATE NULL,
    status ENUM('Disponível', 'Indisponível') DEFAULT 'Disponível',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de movimentações (Módulo 3 - núcleo do sistema)
CREATE TABLE IF NOT EXISTS movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('Entrada', 'Saída', 'Transferência') NOT NULL,
    produto_id INT NOT NULL,
    local_origem_id INT NULL, -- NULL para entradas
    local_destino_id INT NULL, -- NULL para saídas
    quantidade DECIMAL(10,2) NOT NULL,
    usuario_id INT NOT NULL,
    observacao TEXT,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (local_origem_id) REFERENCES locais(id) ON DELETE SET NULL,
    FOREIGN KEY (local_destino_id) REFERENCES locais(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de alertas (Módulo 5)
CREATE TABLE IF NOT EXISTS alertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('Estoque Mínimo', 'Validade Próxima', 'Produto Vencido') NOT NULL,
    produto_id INT NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    data_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Inserir usuário admin padrão se não existir
INSERT IGNORE INTO usuarios (nome, email, senha, funcao) VALUES 
('Administrador', 'admin@snacktrack.com', '$2b$10$1I5FTCZE8ynfjmarko1UW.9cknSTZosPNJWXf1AFXoliQt5u6aBrC', 'Gerente');

-- Inserir locais padrão se não existirem
INSERT IGNORE INTO locais (nome, capacidade_maxima, descricao) VALUES
('Loja Principal', 1000, 'Local de armazenamento na loja'),
('Residência', 500, 'Local de armazenamento na residência da proprietária');

-- Inserir produtos de exemplo se não existirem
INSERT IGNORE INTO produtos (nome, descricao, preco, unidade_medida, categoria, estoque_minimo, tipo) VALUES
('Farinha de Trigo', 'Farinha de trigo especial para panificação', 5.50, 'kg', 'matéria-prima', 10, 'Matéria-prima'),
('Açúcar Refinado', 'Açúcar branco refinado', 4.20, 'kg', 'matéria-prima', 5, 'Matéria-prima'),
('Bolo de Chocolate', 'Bolo de chocolate caseiro', 25.00, 'unidade', 'doce', 2, 'Produto acabado'),
('Coxinha', 'Salgado de frango', 6.00, 'unidade', 'Salgado', 10, 'Produto acabado');
`;

async function runMigrations() {
  try {
    console.log('Starting database migration...');
    await db.query(schemaSQL);
    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error.message);
    throw error;
  }
}

if (require.main === module) {
  runMigrations().then(() => {
    console.log('Migration script completed.');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { runMigrations };