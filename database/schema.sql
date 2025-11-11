-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS snacktrack;
USE snacktrack;

-- Tabela de usuários (base para Módulo 1)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    funcao ENUM('Gerente', 'Colaborador') NOT NULL DEFAULT 'Colaborador',
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de locais (Módulo 2)
CREATE TABLE locais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    capacidade_maxima DECIMAL(10,2),
    descricao TEXT,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de produtos (Módulo 2)
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2),
    unidade_medida VARCHAR(20) DEFAULT 'unidade',
    categoria VARCHAR(50),
    estoque_minimo DECIMAL(10,2) DEFAULT 0,
    fabricante VARCHAR(100),
    tipo ENUM('Matéria-prima', 'Produto semiacabado', 'Produto acabado') DEFAULT 'Matéria-prima',
    status ENUM('Disponível', 'Indisponível') DEFAULT 'Disponível',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de lotes (Módulo 2 - Normalização)
CREATE TABLE lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    numero_lote VARCHAR(50) NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL DEFAULT 0,
    data_validade DATE NULL,
    data_fabricacao DATE NULL,
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    localizacao_id INT NULL, -- Opcional: localização específica do lote
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (localizacao_id) REFERENCES locais(id) ON DELETE SET NULL
);

-- View para obter estoque atual por produto
CREATE VIEW estoque_atual_produtos AS
SELECT 
    p.id as produto_id,
    p.nome as produto_nome,
    COALESCE(SUM(l.quantidade), 0) as estoque_atual
FROM produtos p
LEFT JOIN lotes l ON p.id = l.produto_id
GROUP BY p.id, p.nome;

-- Tabela de movimentações (Módulo 3 - núcleo do sistema)
CREATE TABLE movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('Entrada', 'Saída', 'Transferência') NOT NULL,
    produto_id INT NOT NULL,
    lote_id INT NULL, -- Referencia ao lote específico (opcional para movimentações geral do produto)
    local_origem_id INT NULL, -- NULL para entradas
    local_destino_id INT NULL, -- NULL para saídas
    quantidade DECIMAL(10,2) NOT NULL,
    usuario_id INT NOT NULL,
    observacao TEXT,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL,
    FOREIGN KEY (local_origem_id) REFERENCES locais(id) ON DELETE SET NULL,
    FOREIGN KEY (local_destino_id) REFERENCES locais(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de alertas (Módulo 5)
CREATE TABLE alertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('Estoque Mínimo', 'Validade Próxima', 'Produto Vencido', 'Lote Vencido') NOT NULL,
    produto_id INT NOT NULL,
    lote_id INT NULL, -- Referencia ao lote específico (NULL para alertas gerais do produto)
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    data_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL
);

-- Inserir usuário admin padrão (senha: "admin123" criptografada)
INSERT INTO usuarios (nome, email, senha, funcao) VALUES 
('Administrador', 'admin@snacktrack.com', '$2b$10$1I5FTCZE8ynfjmarko1UW.9cknSTZosPNJWXf1AFXoliQt5u6aBrC', 'Gerente');

-- Inserir locais padrão baseado na documentação
INSERT INTO locais (nome, capacidade_maxima, descricao) VALUES
('Loja Principal', 1000, 'Local de armazenamento na loja'),
('Residência', 500, 'Local de armazenamento na residência da proprietária');

-- Inserir produtos de exemplo
INSERT INTO produtos (nome, descricao, preco, unidade_medida, categoria, estoque_minimo, tipo) VALUES
('Farinha de Trigo', 'Farinha de trigo especial para panificação', 5.50, 'kg', 'matéria-prima', 10, 'Matéria-prima'),
('Açúcar Refinado', 'Açúcar branco refinado', 4.20, 'kg', 'matéria-prima', 5, 'Matéria-prima'),
('Bolo de Chocolate', 'Bolo de chocolate caseiro', 25.00, 'unidade', 'doce', 2, 'Produto acabado'),
('Coxinha', 'Salgado de frango', 6.00, 'unidade', 'Salgado', 10, 'Produto acabado');

-- Inserir lotes de exemplo
INSERT INTO lotes (produto_id, numero_lote, quantidade, data_validade, data_fabricacao) VALUES
(1, 'FAR-001', 50.00, '2024-12-31', '2024-06-01'),
(2, 'ACU-001', 30.00, '2024-11-30', '2024-05-15'),
(3, 'BOL-001', 15.00, '2024-06-15', '2024-06-10'),
(4, 'COX-001', 40.00, '2024-06-12', '2024-06-10');