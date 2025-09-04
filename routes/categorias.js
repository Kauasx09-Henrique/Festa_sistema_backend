const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM categorias ORDER BY nome');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias.', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT * FROM categorias WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categoria.', details: error.message });
  }
});

router.post('/', async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'Nome é um campo obrigatório.' });
  }
  try {
    const { rows } = await db.query(
      'INSERT INTO categorias (nome, descricao) VALUES ($1, $2) RETURNING *',
      [nome, descricao]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Categoria com este nome já existe.', details: error.detail });
    }
    res.status(500).json({ error: 'Erro ao criar categoria.', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, descricao } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'Nome é um campo obrigatório.' });
  }
  try {
    const { rows } = await db.query(
      'UPDATE categorias SET nome = $1, descricao = $2 WHERE id = $3 RETURNING *',
      [nome, descricao, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Categoria com este nome já existe.', details: error.detail });
    }
    res.status(500).json({ error: 'Erro ao atualizar categoria.', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM categorias WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar categoria.', details: error.message });
  }
});

module.exports = router;
