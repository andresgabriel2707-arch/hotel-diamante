const fetch = require('node-fetch');

async function run() {
    console.log("Iniciando pruebas...");
    // 1. Log in como admin
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'admin@diamante.com', contrasena: 'Admin123' })
    });
    const loginData = await loginRes.json();
    console.log("Login:", loginData);

    if (!loginData.success) {
        console.error("Fallo login");
        return;
    }

    const token = loginData.token;

    // 2. Check auth
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const check = await fetch('http://localhost:3000/api/reservas/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabana_id: 'some_id', fecha_llegada: '2026-05-01', fecha_salida: '2026-05-05' })
    });
    console.log("Check:", await check.json());

    // 3. Make reservation
    const res = await fetch('http://localhost:3000/api/reservas', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            cabana_id: 'some_id', huesped: 'Test',
            fecha_llegada: '2026-05-01', fecha_salida: '2026-05-05',
            monto: 0, metodo_pago: 'Test'
        })
    });
    console.log("Reserva result:", await res.json());
}

run();
