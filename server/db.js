const Datastore = require('@seald-io/nedb');
const bcrypt = require('bcryptjs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

// Crear colecciones (archivos .db locales, puro JS, sin Python)
const db = {
    usuarios: new Datastore({ filename: path.join(dataDir, 'usuarios.db'), autoload: true }),
    cabanas:  new Datastore({ filename: path.join(dataDir, 'cabanas.db'),  autoload: true }),
    reservas: new Datastore({ filename: path.join(dataDir, 'reservas.db'), autoload: true }),
};

// Índice único para correos
db.usuarios.ensureIndex({ fieldName: 'correo', unique: true });
db.reservas.ensureIndex({ fieldName: 'codigo',  unique: true });

// ──────────────────────────────────────────
//  SEED: Admin por defecto
// ──────────────────────────────────────────
db.usuarios.findOne({ correo: 'admin@diamante.com' }, (err, doc) => {
    if (!doc) {
        const hash = bcrypt.hashSync('Admin123', 10);
        db.usuarios.insert({ nombre: 'Administrador', correo: 'admin@diamante.com', password_hash: hash, rol: 'admin' });
        console.log('👤  Admin por defecto creado: admin@diamante.com / Admin123');
    }
});

// ──────────────────────────────────────────
//  SEED: Cabañas por defecto
// ──────────────────────────────────────────
db.cabanas.count({}, (err, count) => {
    if (count === 0) {
        db.cabanas.insert([
            { nombre: 'Diamante 1', descripcion: 'Cabaña romántica con vista al río.', tipo: 'Romántica', capacidad: 2, precio: 350000, moneda: 'COP', periodo: 'noche', estado: 'Disponible', fotos: [] },
            { nombre: 'Diamante 2', descripcion: 'Cabaña familiar con amplia terraza.',  tipo: 'Familiar',  capacidad: 6, precio: 550000, moneda: 'COP', periodo: 'noche', estado: 'Disponible', fotos: [] },
            { nombre: 'Diamante 3', descripcion: 'Cabaña de lujo con jacuzzi.',          tipo: 'Lujo',      capacidad: 4, precio: 750000, moneda: 'COP', periodo: 'noche', estado: 'Disponible', fotos: [] },
        ]);
        console.log('🏡  Cabañas de ejemplo insertadas.');
    }
});

module.exports = db;
