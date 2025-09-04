const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

router.post('/registrar', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
  }

  try {
    const userExists = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: 'Este email já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const query = `
            INSERT INTO usuarios (nome, email, senha) 
            VALUES ($1, $2, $3) RETURNING id, nome, email, tipo_usuario;
        `;
    const { rows } = await db.query(query, [nome, email, hashedPassword]);

    const newUser = rows[0];
    newUser.senha = undefined;

    return res.status(201).json(newUser);

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao registrar usuário.', details: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const isPasswordCorrect = await bcrypt.compare(senha, user.senha);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Senha inválida.' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    user.senha = undefined;

    return res.json({ user, token });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao fazer login.', details: error.message });
  }
});

module.exports = router;

