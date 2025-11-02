// Mock database for testing
// This follows the same interface as the real database but uses in-memory storage

const mockData = {
  movimentacoes: [],
  produtos: [],
  locais: [],
  usuarios: [],
};

class MockDatabase {
  constructor() {
    if (MockDatabase.instance) return MockDatabase.instance;

    this.data = { ...mockData };
    this.transactionCounter = 0;
    MockDatabase.instance = this;
    return this;
  }

  async query(sql, params = [], connection = null) {
    const lowerSql = sql.toLowerCase();
    
    if (lowerSql.includes('select')) {
      return this.handleSelect(sql, params);
    } else if (lowerSql.includes('insert')) {
      return this.handleInsert(sql, params);
    } else if (lowerSql.includes('update')) {
      return this.handleUpdate(sql, params);
    } else if (lowerSql.includes('delete')) {
      return this.handleDelete(sql, params);
    }
    
    throw new Error(`Unsupported SQL operation: ${sql}`);
  }

  handleSelect(sql, params) {
    // Simple implementation for the queries used in the application
    if (sql.includes('FROM produtos WHERE id = ?')) {
      const id = params[0];
      return this.data.produtos.filter(p => p.id == id);
    } else if (sql.includes('FROM locais WHERE id = ?')) {
      const id = params[0];
      return this.data.locais.filter(l => l.id == id);
    } else if (sql.includes('FROM usuarios WHERE email = ?')) {
      const email = params[0];
      return this.data.usuarios.filter(u => u.email === email);
    } else if (sql.includes('estoque_atual')) {
      // Mock the stock calculation query
      const localId = params[0]; // All 4 params are the same in the real query
      const produtoId = params[4];
      
      // Calculate stock based on movimentacoes
      let estoque = 0;
      this.data.movimentacoes.forEach(m => {
        if (m.produto_id == produtoId) {
          if (m.tipo === 'Entrada' && m.local_destino_id == localId) {
            estoque += parseFloat(m.quantidade) || 0;
          } else if (m.tipo === 'Saída' && m.local_origem_id == localId) {
            estoque -= parseFloat(m.quantidade) || 0;
          } else if (m.tipo === 'Transferência' && m.local_origem_id == localId) {
            estoque -= parseFloat(m.quantidade) || 0;
          } else if (m.tipo === 'Transferência' && m.local_destino_id == localId) {
            estoque += parseFloat(m.quantidade) || 0;
          }
        }
      });
      
      return [{ estoque_atual: estoque }];
    } else if (sql.includes('FROM movimentacoes WHERE produto_id = ?')) {
      const produtoId = params[0];
      return this.data.movimentacoes.filter(m => m.produto_id == produtoId);
    } else if (sql.includes('FROM movimentacoes WHERE local_origem_id = ? OR local_destino_id = ?')) {
      const localId = params[0];
      return this.data.movimentacoes.filter(m => m.local_origem_id == localId || m.local_destino_id == localId);
    } else if (sql.includes('FROM movimentacoes WHERE id = ?')) {
      const id = params[0];
      return this.data.movimentacoes.filter(m => m.id == id);
    }
    
    // Default return for other select queries
    return [];
  }

  handleInsert(sql, params) {
    if (sql.includes('INTO produtos')) {
      const newProduto = {
        id: this.data.produtos.length + 1,
        nome: params[0],
        descricao: params[1],
        preco: params[2],
        unidade_medida: params[3] || 'unidade',
        categoria: params[4],
        estoque_minimo: params[5] || 0,
        fabricante: params[6],
        tipo: params[7] || 'Matéria-prima',
        data_validade: params[8],
        status: params[9] || 'Disponível',
        data_criacao: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
      this.data.produtos.push(newProduto);
      return { insertId: newProduto.id, affectedRows: 1 };
    } else if (sql.includes('INTO locais')) {
      const newLocal = {
        id: this.data.locais.length + 1,
        nome: params[0],
        capacidade_maxima: params[1],
        descricao: params[2],
        status: 'Ativo',
        data_criacao: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
      this.data.locais.push(newLocal);
      return { insertId: newLocal.id, affectedRows: 1 };
    } else if (sql.includes('INTO movimentacoes')) {
      const newMovimentacao = {
        id: this.data.movimentacoes.length + 1,
        tipo: params[0],
        produto_id: params[1],
        local_origem_id: params[2],
        local_destino_id: params[3],
        quantidade: params[4],
        usuario_id: params[5],
        data_movimentacao: params[6] || new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
      this.data.movimentacoes.push(newMovimentacao);
      return { insertId: newMovimentacao.id, affectedRows: 1 };
    } else if (sql.includes('INTO usuarios')) {
      const newUsuario = {
        id: this.data.usuarios.length + 1,
        ...params.reduce((acc, param, index) => {
          const fields = ['nome', 'email', 'senha_hash', 'funcao', 'status', 'data_criacao'];
          acc[fields[index]] = param;
          return acc;
        }, {}),
      };
      this.data.usuarios.push(newUsuario);
      return { insertId: newUsuario.id, affectedRows: 1 };
    }
    
    return { insertId: 1, affectedRows: 1 };
  }

  handleUpdate(sql, params) {
    const lastParam = params[params.length - 1]; // ID is always the last parameter
    const updates = params.slice(0, -1); // All parameters except the last one
    
    if (sql.includes('UPDATE produtos')) {
      const produto = this.data.produtos.find(p => p.id == lastParam);
      if (produto) {
        const fields = ['nome', 'descricao', 'preco', 'unidade_medida', 'categoria', 'estoque_minimo', 'fabricante', 'tipo', 'data_validade', 'status'];
        updates.forEach((value, index) => {
          if (value !== undefined) produto[fields[index]] = value;
        });
      }
    } else if (sql.includes('UPDATE locais')) {
      const local = this.data.locais.find(l => l.id == lastParam);
      if (local) {
        const fields = ['nome', 'capacidade_maxima', 'descricao', 'status'];
        updates.forEach((value, index) => {
          if (value !== undefined) local[fields[index]] = value;
        });
      }
    } else if (sql.includes('UPDATE usuarios')) {
      const usuario = this.data.usuarios.find(u => u.id == lastParam);
      if (usuario) {
        const fields = ['nome', 'email', 'senha_hash', 'funcao', 'status'];
        updates.forEach((value, index) => {
          if (value !== undefined) usuario[fields[index]] = value;
        });
      }
    }
    
    return { affectedRows: 1 };
  }

  handleDelete(sql, params) {
    return { affectedRows: 0 };
  }

  async beginTransaction() {
    this.transactionCounter++;
    // Return a mock connection object that tracks the transaction
    return { id: this.transactionCounter, inTransaction: true };
  }

  async commit(connection) {
    // In a real implementation, this would commit the transaction
    // For our mock, we just need to decrement the counter
    this.transactionCounter = Math.max(0, this.transactionCounter - 1);
  }

  async rollback(connection) {
    // In a real implementation, this would rollback the transaction
    // For our mock, we'd need more sophisticated tracking to actually rollback
    this.transactionCounter = Math.max(0, this.transactionCounter - 1);
  }
}

module.exports = new MockDatabase();