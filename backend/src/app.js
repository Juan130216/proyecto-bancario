require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const authRutas = require('./rutas/authRutas');
const usuarioRutas = require('./rutas/usuarioRutas');
const cuentaRutas = require('./rutas/cuentaRutas');
const movimientoRutas = require('./rutas/movimientoRutas');
const { conectarBaseDatos } = require('./baseDatos');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 }
}));
app.use('/api/auth', authRutas);
app.use('/api/clientes', usuarioRutas);
app.use('/api/cuentas', cuentaRutas);
app.use('/api/movimientos', movimientoRutas);
app.use('/api', (_req, res) => res.status(404).json({ mensaje: 'Ruta de API no encontrada', resultado: null }));
app.use(express.static(path.join(__dirname, '../../frontend')));

const puerto = Number(process.env.PORT || 3000);

async function iniciar() {
  try {
    await conectarBaseDatos();
    app.listen(puerto, () => console.log(`Banco: http://localhost:${puerto}`));
  } catch (error) {
    console.error('No fue posible iniciar:', error.message);
    process.exit(1);
  }
}

iniciar();