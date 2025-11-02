class Movimentacao {
  constructor({ id, tipo, produto_id, local_origem_id, local_destino_id, quantidade, usuario_id, data_movimentacao } = {}) {
    this.id = id;
    this.tipo = tipo;
    this.produto_id = produto_id;
    this.local_origem_id = local_origem_id;
    this.local_destino_id = local_destino_id;
    this.quantidade = quantidade;
    this.usuario_id = usuario_id;
    this.data_movimentacao = data_movimentacao;
  }

  validate() {
    const errors = [];
    if (!this.tipo) errors.push("tipo é obrigatório");
    if (!this.produto_id) errors.push("produto_id é obrigatório");
    if (!this.quantidade || Number(this.quantidade) <= 0) errors.push("quantidade deve ser maior que zero");
    return errors;
  }

  toDB() {
    return {
      tipo: this.tipo,
      produto_id: this.produto_id,
      local_origem_id: this.local_origem_id || null,
      local_destino_id: this.local_destino_id || null,
      quantidade: this.quantidade,
      usuario_id: this.usuario_id || null,
    };
  }

  toJSON() {
    return {
      id: this.id,
      tipo: this.tipo,
      produto_id: this.produto_id,
      local_origem_id: this.local_origem_id,
      local_destino_id: this.local_destino_id,
      quantidade: this.quantidade,
      usuario_id: this.usuario_id,
      data_movimentacao: this.data_movimentacao,
    };
  }
}

module.exports = Movimentacao;
