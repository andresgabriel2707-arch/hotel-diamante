/**
 * 🧹 SCRIPT DE LIMPIEZA - Hotel Diamante
 * 
 * Propósito: Limpiar duplicados en usuarios.db y recrear índices
 * 
 * Uso: node clean-db.js
 */

const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');

console.log('🔍 Iniciando diagnóstico de base de datos...\n');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    console.error('❌ Carpeta "data" no encontrada en:', dataDir);
    process.exit(1);
}

// ════════════════════════════════════════════════════════════════════
// 1. AUDITAR USUARIOS
// ════════════════════════════════════════════════════════════════════

const usuariosDb = new Datastore({ 
    filename: path.join(dataDir, 'usuarios.db'), 
    autoload: true 
});

usuariosDb.find({}, (err, allDocs) => {
    if (err) {
        console.error('❌ Error al leer usuarios.db:', err);
        process.exit(1);
    }
    
    console.log('📊 DIAGNÓSTICO ACTUAL:');
    console.log('─'.repeat(50));
    console.log(`   Total de registros: ${allDocs.length}`);
    
    if (allDocs.length === 0) {
        console.log('   ℹ️  Base de datos vacía (será repoblada por SEED)\n');
        recrearIndices();
        return;
    }
    
    // Análisis de correos
    const byEmail = {};
    allDocs.forEach(doc => {
        const email = doc.correo || 'SIN_CORREO';
        if (!byEmail[email]) {
            byEmail[email] = [];
        }
        byEmail[email].push(doc._id);
    });
    
    // Detectar duplicados
    let duplicadosCount = 0;
    let duplicadosList = [];
    Object.entries(byEmail).forEach(([email, ids]) => {
        if (ids.length > 1) {
            duplicadosCount += ids.length - 1;
            duplicadosList.push({ email, count: ids.length, ids });
        }
    });
    
    console.log(`   Correos únicos: ${Object.keys(byEmail).length}`);
    console.log(`   Duplicados encontrados: ${duplicadosCount}`);
    
    if (duplicadosList.length > 0) {
        console.log('\n⚠️  CORREOS DUPLICADOS:');
        duplicadosList.forEach(dup => {
            console.log(`   • ${dup.email} → ${dup.count} copias (IDs: ${dup.ids.map(id => id.substring(0, 8)).join(', ')})`);
        });
    } else {
        console.log('\n✅ No hay duplicados detectados');
    }
    
    // Mostrar usurios actuales
    console.log('\n👥 USUARIOS EN BD:');
    allDocs.forEach((doc, i) => {
        console.log(`   ${i+1}. ${doc.correo || 'SIN CORREO'} (${doc.nombre || 'Sin nombre'}) [${doc.rol || 'sin rol'}]`);
    });
    
    console.log('\n' + '─'.repeat(50));
    
    if (duplicadosCount === 0) {
        console.log('✅ Base de datos está limpia');
        recrearIndices();
        return;
    }
    
    // Proceder a limpiar
    console.log(`\n🗑️  LIMPIANDO ${duplicadosCount} DUPLICADOS...\n`);
    
    const toDelete = [];
    Object.entries(byEmail).forEach(([email, ids]) => {
        if (ids.length > 1) {
            // Mantener el primero, eliminar el resto
            const copasAEliminar = ids.slice(1);
            toDelete.push(...copasAEliminar);
        }
    });
    
    usuariosDb.remove({ _id: { $in: toDelete } }, { multi: true }, (err, numRemoved) => {
        if (err) {
            console.error('❌ Error al eliminar duplicados:', err);
            process.exit(1);
        }
        
        console.log(`✅ ${numRemoved} registros duplicados eliminados`);
        
        // Mostrar resultado
        usuariosDb.find({}, (err2, cleanedDocs) => {
            console.log(`✅ Base de datos ahora contiene ${cleanedDocs.length} registros únicos\n`);
            recrearIndices();
        });
    });
});

// ════════════════════════════════════════════════════════════════════
// 2. RECREAR ÍNDICES
// ════════════════════════════════════════════════════════════════════

function recrearIndices() {
    console.log('🔨 RECREANDO ÍNDICES...');
    console.log('─'.repeat(50));
    
    // Índice de usuarios
    usuariosDb.ensureIndex({ fieldName: 'correo', unique: true }, (err) => {
        if (err) {
            console.error('❌ Error creando índice de usuarios:', err);
            process.exit(1);
        }
        console.log('✅ Índice de usuarios creado: correo (UNIQUE)');
        
        // Índice de reservas
        const reservasDb = new Datastore({ 
            filename: path.join(dataDir, 'reservas.db'), 
            autoload: true 
        });
        
        reservasDb.ensureIndex({ fieldName: 'codigo', unique: true }, (err2) => {
            if (err2) {
                console.error('❌ Error creando índice de reservas:', err2);
                process.exit(1);
            }
            console.log('✅ Índice de reservas creado: codigo (UNIQUE)');
            
            finalizarLimpieza();
        });
    });
}

// ════════════════════════════════════════════════════════════════════
// 3. FINALIZAR
// ════════════════════════════════════════════════════════════════════

function finalizarLimpieza() {
    console.log('\n' + '─'.repeat(50));
    console.log('✅ LIMPIEZA COMPLETADA EXITOSAMENTE\n');
    console.log('📝 Resumen:');
    console.log('   • Base de datos limpia de duplicados');
    console.log('   • Índices recreados');
    console.log('   • Base lista para operación normal\n');
    console.log('⚠️  PRÓXIMOS PASOS:');
    console.log('   1. Reinicia el servidor: npm start');
    console.log('   2. Prueba registrando un nuevo usuario');
    console.log('   3. Intenta con el mismo correo (debe fallar con 409)\n');
    
    process.exit(0);
}
