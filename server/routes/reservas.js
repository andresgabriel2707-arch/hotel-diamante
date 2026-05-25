const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAuth, verifyAdmin } = require('./auth');

// GET /api/reservas (Vulnerabilidad cerrada: ahora solo admins pueden ver todas las reservas)
router.get('/', verifyAdmin, (req, res) => {
    db.reservas.find({}).sort({ createdAt: -1 }).exec((err, reservas) => {
        if (err) return res.status(500).json({ success: false });
        // Enriquecer con nombre de cabaña
        const ids = [...new Set(reservas.map(r => r.cabana_id))];
        db.cabanas.find({ _id: { $in: ids } }, (err2, cabanas) => {
            const cabMap = {};
            cabanas.forEach(c => cabMap[c._id] = c.nombre);
            reservas.forEach(r => r.cabana_nombre = cabMap[r.cabana_id] || '-');
            res.json(reservas);
        });
    });
});

// GET /api/reservas/mis-reservas (solo usuario logueado)
router.get('/mis-reservas', verifyAuth, (req, res) => {
    db.reservas.find({ user_id: req.user.id }).sort({ createdAt: -1 }).exec((err, reservas) => {
        if (err) return res.status(500).json({ success: false });
        const ids = [...new Set(reservas.map(r => r.cabana_id))];
        db.cabanas.find({ _id: { $in: ids } }, (err2, cabanas) => {
            const cabMap = {};
            cabanas.forEach(c => cabMap[c._id] = c.nombre);
            reservas.forEach(r => r.cabana_nombre = cabMap[r.cabana_id] || '-');
            res.json(reservas);
        });
    });
});

// POST /api/reservas/check — anti-overbooking
router.post('/check', (req, res) => {
    const { cabana_id, fecha_llegada, fecha_salida } = req.body;
    console.log('📋 POST /check recibido:', { cabana_id, fecha_llegada, fecha_salida });
    if (!cabana_id || !fecha_llegada || !fecha_salida) {
        console.log('❌ Faltan datos en la solicitud');
        return res.status(400).json({ available: false, mensaje: 'Faltan datos.' });
    }
    if (fecha_llegada >= fecha_salida) {
        return res.status(400).json({ available: false, mensaje: 'La fecha de llegada debe ser anterior a la de salida.' });
    }
    // Colisión: reserva existente que se solape con el rango solicitado
    db.reservas.findOne({
        cabana_id,
        estado: { $ne: 'Cancelada' },
        fecha_llegada: { $lt: fecha_salida },
        fecha_salida:  { $gt: fecha_llegada },
    }, (err, conflicto) => {
        if (conflicto) return res.json({ available: false, mensaje: 'Esas fechas ya están ocupadas para esta cabaña.' });
        res.json({ available: true, mensaje: '¡Fechas disponibles! Puedes realizar la reserva.' });
    });
});

// POST /api/reservas — crear reserva
router.post('/', verifyAuth, (req, res) => {
    const { cabana_id, huesped, fecha_llegada, fecha_salida, monto, metodo_pago } = req.body;
    const user_id = req.user.id; // Extraído de forma segura desde el JWT

    if (!cabana_id || !huesped || !fecha_llegada || !fecha_salida) {
        return res.status(400).json({ success: false, mensaje: 'Faltan campos obligatorios.' });
    }
    // Doble verificación anti-overbooking
    db.reservas.findOne({
        cabana_id,
        estado: { $ne: 'Cancelada' },
        fecha_llegada: { $lt: fecha_salida },
        fecha_salida:  { $gt: fecha_llegada },
    }, (err, conflicto) => {
        if (conflicto) return res.status(409).json({ success: false, mensaje: 'Esas fechas ya están reservadas.' });
        const codigo = 'RES-' + Date.now().toString().slice(-6);
        db.reservas.insert({
            codigo, cabana_id, user_id, huesped,
            fecha_llegada, fecha_salida,
            estado: 'Solicitada', pago_estado: 'Pendiente',
            monto: monto || 0, metodo_pago: metodo_pago || 'Por definir',
            createdAt: new Date().toISOString(),
        }, (err2, newDoc) => {
            if (err2) return res.status(500).json({ success: false, mensaje: 'Error al crear reserva.' });
            res.json({ success: true, codigo, mensaje: `Reserva ${codigo} creada exitosamente.` });
        });
    });
});

// PATCH /api/reservas/:id/estado (Vulnerabilidad cerrada: solo admins pueden alterar el estado de la reserva)
router.patch('/:id/estado', verifyAdmin, (req, res) => {
    const { estado } = req.body;
    const validos = ['Activa', 'Solicitada', 'Cancelada', 'Completada'];
    if (!validos.includes(estado)) return res.status(400).json({ success: false, mensaje: 'Estado inválido.' });
    db.reservas.update({ _id: req.params.id }, { $set: { estado } }, {}, (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, mensaje: 'Estado actualizado.' });
    });
});

// PATCH /api/reservas/:id/pago — marcar como Pagado (Vulnerabilidad cerrada: solo admins pueden modificar el estado de pago)
router.patch('/:id/pago', verifyAdmin, (req, res) => {
    const { pago_estado } = req.body;
    const validos = ['Pagado', 'Pendiente'];
    if (!validos.includes(pago_estado)) return res.status(400).json({ success: false, mensaje: 'Estado de pago inválido.' });
    db.reservas.update({ _id: req.params.id }, { $set: { pago_estado } }, {}, (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, mensaje: `Pago marcado como ${pago_estado}.` });
    });
});

module.exports = router;
