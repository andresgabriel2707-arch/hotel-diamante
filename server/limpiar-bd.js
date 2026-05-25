#!/usr/bin/env node

/**
 * Script para limpiar la base de datos corrupta de NeDB
 * Ejecutar: node limpiar-bd.js
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

// Archivos de BD
const archivos = [
    path.join(dataDir, 'usuarios.db'),
    path.join(dataDir, 'cabanas.db'),
    path.join(dataDir, 'reservas.db'),
];

console.log('🧹 Limpiando base de datos...\n');

archivos.forEach(archivo => {
    if (fs.existsSync(archivo)) {
        fs.unlinkSync(archivo);
        console.log(`✅ Eliminado: ${path.basename(archivo)}`);
    } else {
        console.log(`⏭️  No existe: ${path.basename(archivo)}`);
    }
});

console.log('\n✅ Base de datos limpiada.');
console.log('📝 Ahora ejecuta: npm start');
console.log('   Se recrearán los datos por defecto automáticamente.\n');
