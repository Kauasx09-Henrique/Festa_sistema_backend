require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importação das rotas
const authRoutes = require('./routes/auth');
const empresaRoutes = require('./routes/empresas');
const categoriaRoutes = require('./routes/categorias');
const produtoRoutes = require('./routes/produtos');
const carrinhoRoutes = require('./routes/carrinho');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
  res.send('API Loja Virtual no ar!');
});

// Rotas da aplicação
app.use('/auth', authRoutes);
app.use('/empresas', empresaRoutes);
app.use('/categorias', categoriaRoutes);
app.use('/produtos', produtoRoutes);
app.use('/carrinho', carrinhoRoutes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
