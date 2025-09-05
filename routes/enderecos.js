const express = require('express');
const router = express.Router();
const db = require('../db');

// Listar endereços de uma empresa
router.get('/empresa/:id_empresa', async (req, res) => {
  const { id_empresa } = req.params;
  try {
    const { rows } = await db.query(
      'SELECT * FROM enderecos WHERE id_empresa = $1 ORDER BY id',
      [id_empresa]
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar endereços.', details: error.message });
  }
});

// Criar endereço para empresa
router.post('/', async (req, res) => {
  const { id_empresa, logradouro, numero, complemento, bairro, cidade, estado, cep } = req.body;

  if (!id_empresa || !logradouro || !cidade || !estado || !cep) {
    return res.status(400).json({ error: 'Campos obrigatórios: id_empresa, logradouro, cidade, estado, cep' });
  }

  try {
    const query = `
      INSERT INTO enderecos (id_empresa, logradouro, numero, complemento, bairro, cidade, estado, cep)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *;
    `;
    const values = [id_empresa, logradouro, numero, complemento, bairro, cidade, estado, cep];
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar endereço.', details: error.message });
  }
});

// Atualizar endereço
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { logradouro, numero, complemento, bairro, cidade, estado, cep } = req.body;

  try {
    const query = `
      UPDATE enderecos SET logradouro=$1, numero=$2, complemento=$3, bairro=$4, cidade=$5, estado=$6, cep=$7, atualizado_em=NOW()
      WHERE id=$8 RETURNING *;
    `;
    const values = [logradouro, numero, complemento, bairro, cidade, estado, cep, id];
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Endereço não encontrado.' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar endereço.', details: error.message });
  }
});

// Deletar endereço
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM enderecos WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Endereço não encontrado.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar endereço.', details: error.message });
  }
});

module.exports = router;
