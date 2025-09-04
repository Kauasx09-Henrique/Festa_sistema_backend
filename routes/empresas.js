const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM empresas ORDER BY nome');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar empresas.', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT * FROM empresas WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar empresa.', details: error.message });
  }
});

router.post('/', async (req, res) => {
  const { nome, cnpj, email, telefone, logo } = req.body;

  if (!nome || !cnpj || !email) {
    return res.status(400).json({ error: 'Nome, CNPJ e Email são campos obrigatórios.' });
  }

  try {
    const query = `
            INSERT INTO empresas (nome, cnpj, email, telefone, logo)
            VALUES ($1, $2, $3, $4, $5) RETURNING *; 
        `;
    const values = [nome, cnpj, email, telefone, logo];
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'CNPJ ou Email já cadastrado.', details: error.detail });
    }
    res.status(500).json({ error: 'Erro ao criar empresa.', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, cnpj, email, telefone, logo } = req.body;

  if (!nome || !cnpj || !email) {
    return res.status(400).json({ error: 'Nome, CNPJ e Email são campos obrigatórios.' });
  }

  try {
    const query = `
            UPDATE empresas SET nome = $1, cnpj = $2, email = $3, telefone = $4, logo = $5
            WHERE id = $6 RETURNING *;
        `;
    const values = [nome, cnpj, email, telefone, logo, id];
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada para atualizar.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'CNPJ ou Email já pertence a outra empresa.', details: error.detail });
    }
    res.status(500).json({ error: 'Erro ao atualizar empresa.', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM empresas WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada para deletar.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar empresa.', details: error.message });
  }
});

module.exports = router;
