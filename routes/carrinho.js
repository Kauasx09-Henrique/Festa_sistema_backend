const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Aplica o middleware de autenticação a todas as rotas deste arquivo
router.use(authMiddleware);

// Função auxiliar para encontrar o carrinho ativo de um usuário ou criar um novo
const findOrCreateCart = async (userId) => {
  // Procura por um carrinho que não esteja finalizado para o usuário
  let cart = await db.query('SELECT * FROM carrinhos WHERE id_usuario = $1 AND finalizado = false', [userId]);

  // Se não encontrar, cria um novo
  if (cart.rows.length === 0) {
    cart = await db.query('INSERT INTO carrinhos (id_usuario) VALUES ($1) RETURNING *', [userId]);
  }

  return cart.rows[0];
};

// Rota para buscar os itens do carrinho do usuário logado
router.get('/', async (req, res) => {
  try {
    const cart = await findOrCreateCart(req.userId);
    const query = `
            SELECT ci.quantidade, ci.preco_unitario, p.id, p.nome, p.descricao
            FROM carrinho_itens ci
            JOIN produtos p ON ci.id_produto = p.id
            WHERE ci.id_carrinho = $1;
        `;
    const { rows } = await db.query(query, [cart.id]);
    res.status(200).json({ id: cart.id, itens: rows });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar carrinho.', details: error.message });
  }
});

// Rota para adicionar um item ao carrinho
router.post('/adicionar', async (req, res) => {
  const { id_produto, quantidade } = req.body;
  if (!id_produto || !quantidade || quantidade <= 0) {
    return res.status(400).json({ error: 'ID do produto e quantidade são necessários.' });
  }

  try {
    const cart = await findOrCreateCart(req.userId);
    const productResult = await db.query('SELECT preco, quantidade_estoque FROM produtos WHERE id = $1', [id_produto]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const produto = productResult.rows[0];
    if (produto.quantidade_estoque < quantidade) {
      return res.status(400).json({ error: 'Estoque insuficiente.' });
    }

    const itemExists = await db.query('SELECT * FROM carrinho_itens WHERE id_carrinho = $1 AND id_produto = $2', [cart.id, id_produto]);

    let item;
    if (itemExists.rows.length > 0) {
      // Se o item já existe, atualiza a quantidade
      const novaQuantidade = itemExists.rows[0].quantidade + quantidade;
      const { rows } = await db.query(
        'UPDATE carrinho_itens SET quantidade = $1 WHERE id = $2 RETURNING *',
        [novaQuantidade, itemExists.rows[0].id]
      );
      item = rows[0];
    } else {
      // Se o item não existe, insere um novo
      const { rows } = await db.query(
        'INSERT INTO carrinho_itens (id_carrinho, id_produto, quantidade, preco_unitario) VALUES ($1, $2, $3, $4) RETURNING *',
        [cart.id, id_produto, quantidade, produto.preco]
      );
      item = rows[0];
    }

    res.status(201).json(item);

  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar item ao carrinho.', details: error.message });
  }
});

// Rota para remover um item do carrinho
router.delete('/remover/:id_produto', async (req, res) => {
  const { id_produto } = req.params;
  try {
    const cart = await findOrCreateCart(req.userId);
    const { rowCount } = await db.query('DELETE FROM carrinho_itens WHERE id_carrinho = $1 AND id_produto = $2', [cart.id, id_produto]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Item não encontrado no carrinho.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover item do carrinho.', details: error.message });
  }
});

module.exports = router;

