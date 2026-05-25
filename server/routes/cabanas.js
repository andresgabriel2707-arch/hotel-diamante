// POST /api/cabanas — crear nueva cabaña
router.post('/', verifyAdmin, (req, res) => {
    const { nombre, descripcion, tipo, capacidad, precio, estado, fotos } = req.body;
    if (!nombre || !tipo || !capacidad || !precio) {
        return res.status(400).json({ success: false, mensaje: 'Faltan campos obligatorios.' });
    }
    db.cabanas.insert({
        nombre,
        descripcion: descripcion || '',
        tipo,
        capacidad: parseInt(capacidad) || 2,
        precio: parseFloat(precio) || 0,
        estado: estado || 'Disponible',
        fotos: fotos || [],
        moneda: 'COP',
        periodo: 'noche',
        createdAt: new Date().toISOString()
    }, (err, cabana) => {
        if (err) return res.status(500).json({ success: false, mensaje: 'Error al crear cabaña.' });
        res.json({ success: true, cabana });
    });
});
const express = require('express');
const router = express.Router();
const db = require('../db');

const { verifyAdmin } = require('./auth');

// GET /api/cabanas
router.get('/', (req, res) => {
    db.cabanas.find({}).sort({ nombre: 1 }).exec((err, cabanas) => {
        res.json(cabanas);
    });
});

// PUT /api/cabanas/:id (Vulnerabilidad cerrada: expuesta a manipulación pública)
router.put('/:id', verifyAdmin, (req, res) => {
    const { nombre, descripcion, tipo, capacidad, precio, estado, fotos } = req.body;
    db.cabanas.update({ _id: req.params.id }, { $set: { nombre, descripcion, tipo, capacidad, precio, estado, fotos: fotos || [] } }, {}, (err) => {
        if (err) return res.status(500).json({ success: false, mensaje: 'Error al actualizar.' });
        res.json({ success: true, mensaje: 'Cabaña actualizada.' });
    });
});

module.exports = router;
