module.exports = rol => (req, res, next) => {
  const usuario = req.session.usuario;
  if (!usuario) {
    return res.status(401).json({ mensaje: 'Debe iniciar sesión', resultado: null });
  }
  if (rol && usuario.rol !== rol) {
    return res.status(403).json({ mensaje: 'No tiene permiso para esta acción', resultado: null });
  }
  next();
};