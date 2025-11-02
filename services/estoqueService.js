const db = require("../config/database");
const movimentacaoData = require("../data/movimentacaoData");
const produtoData = require("../data/produtoData");
const localData = require("../data/localData");
const Movimentacao = require("../models/Movimentacao");

class ErroEstoqueInsuficiente extends Error {
  constructor(message = "Estoque insuficiente para realizar a operação") {
    super(message);
    this.name = "ErroEstoqueInsuficiente";
    this.code = "ESTOQUE_INSUFICIENTE";
    this.status = 422;
  }
}

class ErroLocalInvalido extends Error {
  constructor(message = "Local de origem ou destino inválido") {
    super(message);
    this.name = "ErroLocalInvalido";
    this.code = "LOCAL_INVALIDO";
    this.status = 400;
  }
}

class ErroProdutoInvalido extends Error {
  constructor(message = "Produto não encontrado ou inativo") {
    super(message);
    this.name = "ErroProdutoInvalido";
    this.code = "PRODUTO_INVALIDO";
    this.status = 400;
  }
}

class EstoqueService {
  // registrar entrada
  static async registrarEntrada(produtoId, localId, quantidade, usuarioId) {
    const produto = await produtoData.findById(produtoId);
    if (!produto || produto.status !== "Disponível") throw new ErroProdutoInvalido();
    const local = await localData.findById(localId);
    if (!local || local.status !== "Ativo") throw new ErroLocalInvalido();

    const conn = await db.beginTransaction();
    try {
      const m = new Movimentacao({
        tipo: "Entrada",
        produto_id: produtoId,
        local_destino_id: localId,
        quantidade,
        usuario_id: usuarioId,
      });
      const errs = m.validate();
      if (errs.length) throw { status: 400, message: errs.join('; ') };
      const created = await movimentacaoData.create(m.toDB(), conn);
      await db.commit(conn);
      return { success: true, movimentacao: created };
    } catch (err) {
      await db.rollback(conn);
      throw err;
    }
  }

  // registrar saida
  static async registrarSaida(produtoId, localId, quantidade, usuarioId) {
    const produto = await produtoData.findById(produtoId);
    if (!produto || produto.status !== "Disponível") throw new ErroProdutoInvalido();
    const local = await localData.findById(localId);
    if (!local || local.status !== "Ativo") throw new ErroLocalInvalido();

    const conn = await db.beginTransaction();
    try {
      // lock/select for update via selecting the estoque calculation using the same connection
      const estoqueAtual = await movimentacaoData.getEstoqueAtual(produtoId, localId, conn);
      if (Number(estoqueAtual) < Number(quantidade)) {
        throw new ErroEstoqueInsuficiente();
      }
      const m = new Movimentacao({
        tipo: "Saída",
        produto_id: produtoId,
        local_origem_id: localId,
        quantidade,
        usuario_id: usuarioId,
      });
      const errs = m.validate();
      if (errs.length) throw { status: 400, message: errs.join('; ') };
      const created = await movimentacaoData.create(m.toDB(), conn);
      await db.commit(conn);
      return { success: true, movimentacao: created, estoqueAnterior: estoqueAtual };
    } catch (err) {
      await db.rollback(conn);
      throw err;
    }
  }

  // transferir produto entre locais
  static async transferir(produtoId, localOrigemId, localDestinoId, quantidade, usuarioId) {
    if (localOrigemId === localDestinoId) throw new ErroLocalInvalido("Locais iguais");
    const produto = await produtoData.findById(produtoId);
    if (!produto || produto.status !== "Disponível") throw new ErroProdutoInvalido();
    const origem = await localData.findById(localOrigemId);
    if (!origem || origem.status !== "Ativo") throw new ErroLocalInvalido();
    const destino = await localData.findById(localDestinoId);
    if (!destino || destino.status !== "Ativo") throw new ErroLocalInvalido("Local destino inválido");

    const conn = await db.beginTransaction();
    try {
      const estoqueOrigem = await movimentacaoData.getEstoqueAtual(produtoId, localOrigemId, conn);
      if (Number(estoqueOrigem) < Number(quantidade)) {
        throw new ErroEstoqueInsuficiente("Estoque insuficiente na origem");
      }
      // Create two movimentacoes: saída from origem, entrada into destino with tipo 'Transferência'
      const mOut = new Movimentacao({
        tipo: "Transferência",
        produto_id: produtoId,
        local_origem_id: localOrigemId,
        local_destino_id: localDestinoId,
        quantidade,
        usuario_id: usuarioId,
      });
      const errs = mOut.validate();
      if (errs.length) throw { status: 400, message: errs.join('; ') };
      const created = await movimentacaoData.create(mOut.toDB(), conn);
      await db.commit(conn);
      return { success: true, movimentacao: created, estoqueOrigemAntes: estoqueOrigem };
    } catch (err) {
      await db.rollback(conn);
      throw err;
    }
  }
}

module.exports = { EstoqueService, ErroEstoqueInsuficiente, ErroLocalInvalido, ErroProdutoInvalido };
