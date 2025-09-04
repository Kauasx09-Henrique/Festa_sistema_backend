const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const query = `
            SELECT p.*, c.nome as categoria_nome, e.nome as empresa_nome
            FROM produtos p
            LEFT JOIN categorias c ON p.id_categoria = c.id
            LEFT JOIN empresas e ON p.id_empresa = e.id
            ORDER BY p.nome;
        `;
    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos.', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
            SELECT p.*, c.nome as categoria_nome, e.nome as empresa_nome
            FROM produtos p
            LEFT JOIN categorias c ON p.id_categoria = c.id
            LEFT JOIN empresas e ON p.id_empresa = e.id
            WHERE p.id = $1;
        `;
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto.', details: error.message });
  }
});

router.post('/', async (req, res) => {
  const { nome, descricao, preco, quantidade_estoque, id_categoria, id_empresa } = req.body;
  if (!nome || preco === undefined || quantidade_estoque === undefined || !id_empresa) {
    return res.status(400).json({ error: 'Nome, preço, estoque e id da empresa são obrigatórios.' });
  }
  try {
    const query = `
            INSERT INTO produtos (nome, descricao, preco, quantidade_estoque, id_categoria, id_empresa)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
    const values = [nome, descricao, preco, quantidade_estoque, id_categoria, id_empresa];
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar produto.', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, quantidade_estoque, id_categoria, id_empresa } = req.body;
  if (!nome || preco === undefined || quantidade_estoque === undefined || !id_empresa) {
    return res.status(400).json({ error: 'Nome, preço, estoque e id da empresa são obrigatórios.' });
  }
  try {
    const query = `
            UPDATE produtos SET nome = $1, descricao = $2, preco = $3, 
            quantidade_estoque = $4, id_categoria = $5, id_empresa = $6
            WHERE id = $7 RETURNING *;
        `;
    const values = [nome, descricao, preco, quantidade_estoque, id_categoria, id_empresa, id];
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar produto.', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM produtos WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar produto.', details: error.message });
  }
});

module.exports = router;
