const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Servir el frontend (HTML, CSS, JS, imágenes) como archivos estáticos
app.use(express.static(path.join(__dirname, '..')));

// Importar rutas
const authRoutes = require('./routes/auth');
const cabanasRoutes = require('./routes/cabanas');
const reservasRoutes = require('./routes/reservas');

app.use('/api/auth', authRoutes);
app.use('/api/cabanas', cabanasRoutes);
app.use('/api/reservas', reservasRoutes);

// Ruta de chequeo de salud
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor Hotel Diamante corriendo correctamente.' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor Hotel Diamante escuchando en http://localhost:${PORT}`);
});
