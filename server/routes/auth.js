const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'diamante_secret_2026_development_only';

// Rate limiter para login (DESACTIVADO PARA PRUEBAS)
const loginLimiter = (req, res, next) => next();

// Validadores
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

function isStrongPassword(pwd) {
    // Mínimo 8 caracteres, 1 mayúscula, 1 número
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /\d/.test(pwd);
}

// POST /api/auth/register
router.post('/register', (req, res) => {
    const { nombre, correo, contrasena, edad, documento } = req.body;
    if (!nombre || !correo || !contrasena) {
        return res.status(400).json({ success: false, mensaje: 'Nombre, correo y contraseña son obligatorios.' });
    }
    
    // ✅ Validar correo
    if (!isValidEmail(correo)) {
        return res.status(400).json({ success: false, mensaje: 'Correo inválido. Usa formato: usuario@dominio.com' });
    }
    
    // ✅ Validar contraseña
    if (!isStrongPassword(contrasena)) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'Contraseña debe tener: mín. 8 caracteres, 1 mayúscula, 1 número' 
        });
    }
    
    const hash = bcrypt.hashSync(contrasena, 10);
    db.usuarios.insert({ nombre, correo: correo.toLowerCase(), password_hash: hash, rol: 'cliente', edad, documento }, (err) => {
        if (err && err.errorType === 'uniqueViolated') {
            return res.status(409).json({ success: false, mensaje: 'Ese correo ya está registrado.' });
        }
        if (err) return res.status(500).json({ success: false, mensaje: 'Error interno.' });
        res.json({ success: true, mensaje: 'Registro completado. Ya puedes iniciar sesión.' });
    });
});

// POST /api/auth/login
router.post('/login', loginLimiter, (req, res) => {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
        return res.status(400).json({ success: false, mensaje: 'Correo y contraseña son obligatorios.' });
    }
    db.usuarios.findOne({ correo: correo.toLowerCase() }, (err, user) => {
        if (!user || !bcrypt.compareSync(contrasena, user.password_hash)) {
            return res.status(401).json({ success: false, mensaje: 'Credenciales incorrectas.' });
        }
        const token = jwt.sign({ id: user._id, correo: user.correo, rol: user.rol }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token, rol: user.rol, nombre: user.nombre });
    });
});

// GET /api/auth/users (solo admin)
router.get('/users', verifyAdmin, (req, res) => {
    db.usuarios.find({ rol: 'cliente' }, { password_hash: 0 }, (err, users) => {
        res.json(users);
    });
});

// GET /api/auth/admins (solo admin)
router.get('/admins', verifyAdmin, (req, res) => {
    db.usuarios.find({ rol: 'admin' }, { password_hash: 0 }, (err, admins) => {
        res.json(admins);
    });
});

// POST /api/auth/add-admin (solo admin)
router.post('/add-admin', verifyAdmin, (req, res) => {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
        return res.status(400).json({ success: false, mensaje: 'Correo y contraseña son obligatorios.' });
    }
    const hash = bcrypt.hashSync(contrasena, 10);
    db.usuarios.insert({ nombre: 'Admin', correo: correo.toLowerCase(), password_hash: hash, rol: 'admin' }, (err) => {
        if (err && err.errorType === 'uniqueViolated') {
            return res.status(409).json({ success: false, mensaje: 'Ese correo ya existe en el sistema.' });
        }
        res.json({ success: true, mensaje: 'Administrador creado correctamente.' });
    });
});

// DELETE /api/auth/admins/:id (solo admin)
router.delete('/admins/:id', verifyAdmin, (req, res) => {
    if (req.user.id === req.params.id) {
        return res.status(400).json({ success: false, mensaje: 'No puedes eliminarte a ti mismo.' });
    }
    db.usuarios.remove({ _id: req.params.id }, {}, () => {
        res.json({ success: true, mensaje: 'Administrador eliminado.' });
    });
});

// DELETE /api/auth/users/:id (solo admin)
router.delete('/users/:id', verifyAdmin, (req, res) => {
    db.usuarios.remove({ _id: req.params.id }, {}, () => {
        res.json({ success: true, mensaje: 'Cliente eliminado.' });
    });
});

// Middleware: verificar token general (cualquier rol)
function verifyAuth(req, res, next) {
    const token = (req.headers['authorization'] || '').split(' ')[1];
    if (!token) return res.status(401).json({ success: false, mensaje: 'Token requerido.' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ success: false, mensaje: 'Token inválido o expirado.' });
    }
}

// Middleware: verificar token y rol admin
function verifyAdmin(req, res, next) {
    const token = (req.headers['authorization'] || '').split(' ')[1];
    if (!token) return res.status(401).json({ success: false, mensaje: 'Token requerido.' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.rol !== 'admin') return res.status(403).json({ success: false, mensaje: 'Acceso denegado.' });
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ success: false, mensaje: 'Token inválido o expirado.' });
    }
}

module.exports = router;
module.exports.verifyAdmin = verifyAdmin;
module.exports.verifyAuth = verifyAuth;
module.exports.JWT_SECRET = JWT_SECRET;
