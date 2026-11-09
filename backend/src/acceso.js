const acceso = rol => (req, res, next) => {
  const usuario = req.session.usuario;
  if (!usuario) {
    return res.status(401).json({ mensaje: 'Debe iniciar sesión', resultado: null });
  }
  if (rol && usuario.rol !== rol) {
    return res.status(403).json({ mensaje: 'No tiene permiso para esta acción', resultado: null });
  }
  next();
};

acceso.cajero = (req, res, next) => {
  if (!req.session.cajero) {
    return res.status(401).json({ mensaje: 'Debe ingresar al cajero con su cuenta y PIN', resultado: null });
  }
  next();
};

module.exports = acceso;