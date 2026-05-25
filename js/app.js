// ============================================================
//  CAPA DE DATOS — conectada al backend real (localhost:3000)
// ============================================================
const API = 'http://localhost:3000/api';

// Helpers
const getToken = () => localStorage.getItem('diamante_jwt');
const authHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

// ✅ VALIDADORES FRONTEND
const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
};

const isStrongPassword = (pwd) => {
    // Mínimo 8 caracteres, 1 mayúscula, 1 número
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /\d/.test(pwd);
};

// ── Cabañas ──────────────────────────────────────────────────
const getCabanas = async () => {
    try {
        const r = await fetch(`${API}/cabanas`);
        return await r.json();
    } catch {
        console.error('Error al obtener cabañas. ¿Está corriendo el servidor?');
        return [];
    }
};

const saveCabanas = async (cabana) => {
    try {
        await fetch(`${API}/cabanas/${cabana._id}`, {
            method: 'PUT', headers: authHeaders(), body: JSON.stringify(cabana)
        });
    } catch(e) { console.error('Error guardando cabaña', e); }
};

const createCabana = async (cabana) => {
    try {
        await fetch(`${API}/cabanas`, {
            method: 'POST', headers: authHeaders(), body: JSON.stringify(cabana)
        });
    } catch(e) { console.error('Error creando cabaña', e); }
};

// ── Reservas ─────────────────────────────────────────────────
const getReservations = async () => {
    try {
        const r = await fetch(`${API}/reservas`, { headers: authHeaders() });
        return await r.json();
    } catch { return []; }
};

const reserveCabana = async (data) => {
    // Primero verificar disponibilidad (anti-overbooking real)
    const checkRes = await fetch(`${API}/reservas/check`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabana_id: data.cabana_id, fecha_llegada: data.llegada, fecha_salida: data.salida })
    });
    const check = await checkRes.json();
    if (!check.available) return { success: false, mensaje: check.mensaje };

    const res = await fetch(`${API}/reservas`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
            cabana_id: data.cabana_id, huesped: data.huesped,
            fecha_llegada: data.llegada, fecha_salida: data.salida,
            monto: data.monto || 0, metodo_pago: data.metodoPago || 'Por definir'
        })
    });
    return await res.json();
};

const getMisReservas = async () => {
    try {
        const r = await fetch(`${API}/reservas/mis-reservas`, { headers: authHeaders() });
        if(!r.ok) return [];
        return await r.json();
    } catch { return []; }
};

// ── Usuarios ─────────────────────────────────────────────────
const getRegisteredUsers = async () => {
    try {
        const r = await fetch(`${API}/auth/users`, { headers: authHeaders() });
        return await r.json();
    } catch { return []; }
};

const registerUser = async (data) => {
    try {
        // ✅ VALIDAR CORREO
        if (!isValidEmail(data.correo)) {
            return { success: false, mensaje: 'Correo inválido. Usa formato: usuario@dominio.com' };
        }
        
        // ✅ VALIDAR CONTRASEÑA
        if (!isStrongPassword(data.contrasena)) {
            return { success: false, mensaje: 'Contraseña debe tener: mín. 8 caracteres, 1 mayúscula, 1 número' };
        }
        
        const payload = { 
            nombre: data.nombre, correo: data.correo.toLowerCase(), contrasena: data.contrasena, 
            edad: data.edad, documento: data.documento 
        };
        if (data.cabana_id) payload.cabana_id = data.cabana_id;
        if (data.fecha_llegada) payload.fecha_llegada = data.fecha_llegada;
        if (data.fecha_salida) payload.fecha_salida = data.fecha_salida;

        const r = await fetch(`${API}/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await r.json();
    } catch { return { success: false, mensaje: 'No se pudo conectar al servidor.' }; }
};

const deleteClient = async (id) => {
    await fetch(`${API}/auth/users/${id}`, { method: 'DELETE', headers: authHeaders() });
};

// ── Admins ───────────────────────────────────────────────────
const getAdminAccounts = async () => {
    try {
        const r = await fetch(`${API}/auth/admins`, { headers: authHeaders() });
        return await r.json();
    } catch { return []; }
};

const saveAdminAccounts = async (correo, contrasena) => {
    const r = await fetch(`${API}/auth/add-admin`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ correo, contrasena })
    });
    return await r.json();
};

const deleteAdmin = async (id) => {
    await fetch(`${API}/auth/admins/${id}`, { method: 'DELETE', headers: authHeaders() });
};

// ── Auth ─────────────────────────────────────────────────────
const login = async (correo, contrasena) => {
    try {
        const r = await fetch(`${API}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
        });
        const data = await r.json();
        if (data.success) {
            // Guardar el JWT real firmado por el servidor
            localStorage.setItem('diamante_jwt', data.token);
            localStorage.setItem('diamante_role', data.rol);
            localStorage.setItem('diamante_nombre', data.nombre);
        }
        return { success: data.success, role: data.rol, mensaje: data.mensaje };
    } catch {
        return { success: false, mensaje: 'No se pudo conectar al servidor. Asegúrate de que esté corriendo.' };
    }
};

const logout = () => {
    localStorage.removeItem('diamante_jwt');
    localStorage.removeItem('diamante_role');
    localStorage.removeItem('diamante_nombre');
    window.location.href = 'index.html';
};

const isAuthenticated = () => !!localStorage.getItem('diamante_jwt');
const isAdmin = () => localStorage.getItem('diamante_role') === 'admin';

const initAdminAccounts = () => {
    const container = document.getElementById('adminAccountsSection');
    if (!container) return;

    const form = document.getElementById('addAdminForm');
    const tableBody = document.getElementById('adminAccountsRows');
    const msg = document.getElementById('addAdminMessage');

    const renderTable = async () => {
        const admins = await getAdminAccounts();
        if (!Array.isArray(admins)) { tableBody.innerHTML = '<tr><td colspan="3">Error cargando admins.</td></tr>'; return; }
        tableBody.innerHTML = admins.map(a => `
            <tr>
                <td>${a.correo}</td>
                <td style="font-family:monospace; color:var(--primary); letter-spacing:1px;">••••••••</td>
                <td><button class="btn-ghost remove-admin" data-id="${a._id}" ${a.correo==='admin@diamante.com'?'disabled':''}>Eliminar</button></td>
            </tr>
        `).join('');

        document.querySelectorAll('.remove-admin').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id = e.target.dataset.id;
                if (confirm('¿Eliminar esta cuenta de administrador?')) {
                    await deleteAdmin(id);
                    renderTable();
                }
            });
        });
    };

    renderTable();

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const correo = document.getElementById('newAdminEmail').value.trim();
        const contrasena = document.getElementById('newAdminPassword').value;
        msg.textContent = '';
        msg.className = 'message';

        if (!correo || !contrasena) { msg.textContent = 'Ambos campos son obligatorios.'; return; }
        if (contrasena.length < 8) { msg.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return; }
        if (!/[A-Z]/.test(contrasena)) { msg.textContent = 'La contraseña debe tener al menos 1 mayúscula.'; return; }
        if (!/\d/.test(contrasena)) { msg.textContent = 'La contraseña debe tener al menos 1 número.'; return; }

        const result = await saveAdminAccounts(correo, contrasena);
        if (result.success) {
            renderTable();
            form.reset();
            msg.textContent = `Administrador ${correo} agregado exitosamente.`;
            msg.classList.add('success');
        } else {
            msg.textContent = result.mensaje || 'Error al agregar administrador.';
            msg.classList.add('error');
        }
    });
};

// --- UI (ui.js) ---
const initHome = async () => {
    const cards = document.getElementById('cabañaCards');
    const filter = document.getElementById('filterType');
    const form = document.getElementById('checkAvailabilityForm');
    const resultDiv = document.getElementById('availabilityResult');
    let allCabanas = [];

    const renderCards = (lista) => {
        if (!cards) return;
        cards.innerHTML = '';
        lista.forEach(c => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `<h3>${c.nombre}</h3><p>${c.descripcion}</p><p><strong>Tipo:</strong> ${c.tipo}</p>
                <p><strong>Estado:</strong> <span style="color: ${c.estado === 'Disponible' ? 'var(--success)' : 'var(--danger)'}">${c.estado}</span></p>
                <p><strong>Precio:</strong> ${c.precio}</p>`;
            cards.appendChild(card);
        });
    };

    if (filter) {
        // Cargar cabañas desde la BD y llenar el <select>
        allCabanas = await getCabanas();
        filter.innerHTML = '<option value="">— Selecciona una cabaña —</option>';
        allCabanas.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c._id || c.id;
            opt.textContent = `${c.nombre} — ${c.tipo} (${c.precio})`;
            filter.appendChild(opt);
        });

        // Mostrar todas las cabañas inicialmente
        if (cards) renderCards(allCabanas);

        // Establecer fecha mínima = hoy
        const hoy = new Date().toISOString().split('T')[0];
        const inputLlegada = document.getElementById('checkLlegada');
        const inputSalida = document.getElementById('checkSalida');
        if (inputLlegada) inputLlegada.min = hoy;
        if (inputSalida) inputSalida.min = hoy;

        // Cuando cambie la fecha de llegada, ajustar mínimo de salida
        if (inputLlegada && inputSalida) {
            inputLlegada.addEventListener('change', () => {
                inputSalida.min = inputLlegada.value;
                if (inputSalida.value && inputSalida.value <= inputLlegada.value) {
                    inputSalida.value = '';
                }
            });
        }
    }

    // Manejar el formulario de consulta de disponibilidad
    if (form && resultDiv) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cabanaId = filter.value;
            const llegada = document.getElementById('checkLlegada').value;
            const salida = document.getElementById('checkSalida').value;

            if (!cabanaId || !llegada || !salida) {
                resultDiv.style.background = '#fff3cd';
                resultDiv.style.color = '#856404';
                resultDiv.textContent = '⚠️ Selecciona una cabaña y ambas fechas.';
                return;
            }

            if (llegada >= salida) {
                resultDiv.style.background = '#fff3cd';
                resultDiv.style.color = '#856404';
                resultDiv.textContent = '⚠️ La fecha de llegada debe ser anterior a la de salida.';
                return;
            }

            // Consultar disponibilidad al backend (JDBC → MySQL)
            const btn = form.querySelector('button');
            btn.disabled = true;
            btn.textContent = 'Consultando...';
            resultDiv.textContent = '';
            resultDiv.style.background = 'transparent';

            try {
                const res = await fetch(`${API}/reservas/check`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cabana_id: cabanaId, fecha_llegada: llegada, fecha_salida: salida })
                });
                const data = await res.json();

                if (data.available) {
                    resultDiv.style.background = '#d4edda';
                    resultDiv.style.color = '#155724';
                    resultDiv.innerHTML = '✅ ¡Fechas disponibles! Redirigiendo a reservas...';
                    setTimeout(() => {
                        window.location.href = `cabanas.html?cabana=${cabanaId}&llegada=${llegada}&salida=${salida}`;
                    }, 1000);
                } else {
                    resultDiv.style.background = '#f8d7da';
                    resultDiv.style.color = '#721c24';
                    resultDiv.textContent = '❌ ' + (data.mensaje || 'Esas fechas no están disponibles para esta cabaña.');
                }
            } catch (err) {
                resultDiv.style.background = '#f8d7da';
                resultDiv.style.color = '#721c24';
                resultDiv.textContent = '❌ Error al conectar con el servidor.';
            }

            btn.disabled = false;
            btn.textContent = 'Consultar disponibilidad';
        });
    }
};

const initCabanasPage = async () => {
    const list = document.getElementById('cabanasPageList');
    if (!list) return;
    list.innerHTML = '<p style="text-align:center; width:100%;">Cargando cabañas...</p>';
    const data = await getCabanas();
    list.innerHTML = data.map(c => `
        <article class="card">
            <div class="cabana-gallery">
                <div class="main-photo" style="background-image: url('${c.fotos[0]}');"></div>
                <div class="sub-photos">
                    <div class="photo" style="background-image: url('${c.fotos[1]}');"></div>
                    <div class="photo" style="background-image: url('${c.fotos[2]}');"></div>
                    <div class="photo" style="background-image: url('${c.fotos[3]}');"></div>
                </div>
            </div>
            <h3>${c.nombre}</h3>
            <p>${c.descripcion}</p>
            <p><strong>Capacidad:</strong> ${c.capacidad}</p>
            <p><strong>Precio:</strong> ${c.precio}</p>
            <hr style="border-color: rgba(255,255,255,0.05); margin: 1.5rem 0;">
            <form class="cabana-reserve-form" data-id="${c._id || c.id}" style="display:flex; flex-direction:column; gap:0.8rem;">
                <label style="margin:0; font-weight:500; font-size:0.9rem;">Verificar disponibilidad</label>
                <div style="display:flex; gap:0.5rem; width:100%;">
                    <label style="flex:1; display:flex; flex-direction:column; min-width:0; font-size:0.85rem;">Llegada <input type="date" class="llegada" required style="margin-top:0.3rem; width:100%; box-sizing:border-box; padding:0.5rem;"></label>
                    <label style="flex:1; display:flex; flex-direction:column; min-width:0; font-size:0.85rem;">Salida <input type="date" class="salida" required style="margin-top:0.3rem; width:100%; box-sizing:border-box; padding:0.5rem;"></label>
                </div>
                <button type="submit" class="btn-primary" style="width:100%; padding:0.6rem;">Comprobar y Reservar</button>
                <p class="res-msg message" style="margin:0; min-height:1rem; font-size:0.85rem; padding:0;"></p>
            </form>
        </article>
    `).join('');

    // Pre-llenar formulario si viene de la página de inicio o tiene una reserva pendiente
    const urlParams = new URLSearchParams(window.location.search);
    const presetCabana = urlParams.get('cabana') || sessionStorage.getItem('pending_reserva_cabana');
    const presetLlegada = urlParams.get('llegada') || sessionStorage.getItem('pending_reserva_llegada');
    const presetSalida = urlParams.get('salida') || sessionStorage.getItem('pending_reserva_salida');
    const hasPendingReserva = !!sessionStorage.getItem('pending_reserva_cabana');

    if (presetCabana) {
        // Le damos un poco de tiempo para que el DOM se asiente
        setTimeout(() => {
            const formToPreset = document.querySelector(`.cabana-reserve-form[data-id="${presetCabana}"]`);
            if (formToPreset) {
                if (presetLlegada) formToPreset.querySelector('.llegada').value = presetLlegada;
                if (presetSalida) formToPreset.querySelector('.salida').value = presetSalida;
                
                // Resaltar la tarjeta para que el usuario la vea claramente
                const card = formToPreset.closest('.card');
                if (card) {
                    card.style.border = '2px solid var(--primary)';
                    card.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.5)';
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                // Si hay reserva pendiente y ya estamos autenticados, ¡dispararla automáticamente!
                if (hasPendingReserva && isAuthenticated()) {
                    sessionStorage.removeItem('pending_reserva_cabana');
                    sessionStorage.removeItem('pending_reserva_llegada');
                    sessionStorage.removeItem('pending_reserva_salida');
                    
                    const msg = formToPreset.querySelector('.res-msg');
                    msg.textContent = 'Procesando tu reserva pendiente...';
                    msg.style.color = 'var(--primary)';
                    
                    formToPreset.querySelector('button').click();
                }
            }
        }, 100);
    }

    document.querySelectorAll('.cabana-reserve-form').forEach(form => {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const llegada = form.querySelector('.llegada').value;
            const salida = form.querySelector('.salida').value;
            const cabanaId = form.dataset.id;
            
            if (!isAuthenticated()) {
                // Guardar destino en sesión y datos de reserva para retomarla
                sessionStorage.setItem('reserva_returnTo', 'cabanas.html');
                sessionStorage.setItem('pending_reserva_cabana', cabanaId);
                sessionStorage.setItem('pending_reserva_llegada', llegada);
                sessionStorage.setItem('pending_reserva_salida', salida);
                window.location.href = 'login.html?returnTo=cabanas.html';
                return;
            }
            
            const btn = form.querySelector('button');
            const msg = form.querySelector('.res-msg');
            
            btn.disabled = true;
            btn.textContent = 'Verificando...';
            msg.textContent = '';
            msg.className = 'res-msg message';
            
            const huesped = localStorage.getItem('diamante_nombre') || 'Cliente Web';

            const res = await reserveCabana({
                cabana_id: cabanaId,
                huesped,
                llegada,
                salida
            });
            
            if(res.success) {
                msg.classList.add('success');
                msg.textContent = res.mensaje || '¡Reserva solicitada!';
                form.reset();
            } else {
                msg.classList.add('error');
                msg.textContent = res.mensaje || 'Fechas ocupadas.';
            }
            btn.textContent = 'Comprobar y Reservar';
            btn.disabled = false;
        });
    });
};

const initLogin = () => {
    const form = document.getElementById('loginForm');
    const message = document.getElementById('loginMessage');
    if (!form) return;

    // Destino tras login: viene de intentar reservar
    const returnTo = sessionStorage.getItem('reserva_returnTo') || null;

    // Mostrar banner si viene de reservar
    if (returnTo) {
        message.textContent = '⚠️ Inicia sesión para completar tu reserva. ¿No tienes cuenta? Regístrate.';
        message.className = 'message';
        message.style.background = 'rgba(255,193,7,0.15)';
        message.style.color = '#ffc107';
        message.style.padding = '0.8rem';
        message.style.borderRadius = '8px';
        message.style.marginBottom = '1rem';
    }

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        const btn = form.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Cargando...';
        message.textContent = 'Autenticando...';
        message.className = 'message';
        message.style = '';
        const res = await login(email, pass);
        if (res.success) {
            message.textContent = '¡Ingreso exitoso! Redirigiendo...';
            message.classList.add('success');
            let redirect;
            if (res.role === 'admin') {
                // Admin siempre va a su panel
                redirect = 'admin-dashboard.html';
            } else if (returnTo) {
                // Cliente que vino a reservar -> regresa a donde estaba
                sessionStorage.removeItem('reserva_returnTo');
                redirect = returnTo;
            } else {
                // Login directo sin contexto de reserva -> inicio
                redirect = 'index.html';
            }
            setTimeout(() => window.location.href = redirect, 700);
        } else {
            message.textContent = res.mensaje || 'Error al iniciar sesión.';
            message.classList.add('error');
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    });
};

const initRegister = () => {
    const form = document.getElementById('registerForm');
    const message = document.getElementById('registerMessage');
    if (!form) return;

    const returnTo = sessionStorage.getItem('reserva_returnTo') || null;

    if (returnTo) {
        message.textContent = '🏡 Crea tu cuenta para completar tu reserva. ¡Solo toma un minuto!';
        message.className = 'message';
        message.style.background = 'rgba(255,193,7,0.15)';
        message.style.color = '#ffc107';
        message.style.padding = '0.8rem';
        message.style.borderRadius = '8px';
        message.style.marginBottom = '1rem';
    }

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = form.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Procesando...';
        message.className = 'message';
        message.style = '';
        message.textContent = '';
        const correo = document.getElementById('registerEmail').value;
        const contrasena = document.getElementById('registerPassword').value;
        const usuario = {
            nombre: document.getElementById('registerName').value,
            correo,
            contrasena,
            edad: document.getElementById('registerAge').value,
            documento: document.getElementById('registerDocument').value,
        };
        try {
            const data = await registerUser(usuario);
            message.classList.remove('error', 'success');
            if (data.success) {
                message.classList.add('success');
                message.textContent = '¡Cuenta creada! Iniciando sesión...';
                form.reset();
                const loginRes = await login(correo, contrasena);
                // Siempre regresar al origen de la reserva, o a cabañas si no hay destino
                const dest = sessionStorage.getItem('reserva_returnTo') || 'cabanas.html';
                sessionStorage.removeItem('reserva_returnTo');
                setTimeout(() => window.location.href = dest, 900);
            } else {
                message.textContent = data.mensaje || 'Error. Intenta con otro correo.';
                message.classList.add('error');
            }
        } catch (error) {
            message.textContent = 'Error de conexión. Intente de nuevo.';
            message.classList.add('error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Registrar';
        }
    });
};

// ---- Nav dinámico según estado de autenticación ----
const initNavAuth = () => {
    const nombre = localStorage.getItem('diamante_nombre') || 'Cliente';
    const role   = localStorage.getItem('diamante_role');
    const auth   = isAuthenticated();

    const navLogin    = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const navMiCuenta = document.getElementById('nav-mi-cuenta');
    const navLogout   = document.getElementById('nav-logout');
    const navGreeting = document.getElementById('nav-greeting');

    if (auth) {
        if (navLogin)    navLogin.style.display    = 'none';
        if (navRegister) navRegister.style.display  = 'none';
        if (navMiCuenta) {
            navMiCuenta.style.display = '';
            navMiCuenta.href = role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
            navMiCuenta.textContent = role === 'admin' ? '🛡️ Panel Admin' : '👤 Mi cuenta';
        }
        if (navLogout) {
            navLogout.style.display = '';
            navLogout.addEventListener('click', e => { e.preventDefault(); logout(); });
        }
        if (navGreeting) {
            navGreeting.style.display = '';
            navGreeting.textContent = `Hola, ${nombre.split(' ')[0]}`;
        }
    } else {
        if (navLogin)    navLogin.style.display    = '';
        if (navRegister) navRegister.style.display  = '';
        if (navMiCuenta) navMiCuenta.style.display  = 'none';
        if (navLogout)   navLogout.style.display    = 'none';
        if (navGreeting) navGreeting.style.display  = 'none';
    }
};

const initClientManagement = () => {
    const form = document.getElementById('clientForm');
    const msg = document.getElementById('clientMessage');
    const tableBody = document.getElementById('clientRows');
    if (!form || !tableBody) return;

    const renderClients = async () => {
        const users = await getRegisteredUsers();
        if (!Array.isArray(users) || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay clientes registrados aún.</td></tr>';
            return;
        }
        tableBody.innerHTML = users.map(u => `
            <tr>
                <td>${u.nombre || '-'}</td>
                <td>${u.correo}</td>
                <td>${u.documento || '-'}</td>
                <td><button class="btn-ghost remove-client" data-id="${u._id}">Eliminar</button></td>
            </tr>
        `).join('');

        document.querySelectorAll('.remove-client').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id = e.target.dataset.id;
                if (confirm('¿Eliminar este cliente?')) {
                    await deleteClient(id);
                    renderClients();
                }
            });
        });
    };

    renderClients();

    // Cargar cabañas para el select de reserva obligatoria
    const cabanaSelect = document.getElementById('clientCabanaId');
    if (cabanaSelect) {
        getCabanas().then(cabanas => {
            cabanaSelect.innerHTML = '<option value="">— Selecciona cabaña —</option>' + 
                cabanas.map(c => `<option value="${c.id || c._id}">${c.nombre}</option>`).join('');
        });
    }

    form.addEventListener('submit', async e => {
        e.preventDefault();
        msg.textContent = '';
        msg.className = 'message';
        const formBtn = form.querySelector('button');
        formBtn.disabled = true;

        const correo = document.getElementById('clientEmail').value.trim();
        const contrasena = document.getElementById('clientPassword').value;
        const nombre = document.getElementById('clientName').value.trim();
        const documento = document.getElementById('clientDoc').value.trim();

        if (contrasena.length < 8) { 
            msg.textContent = 'La contraseña debe tener al menos 8 caracteres.'; 
            msg.classList.add('error');
            formBtn.disabled = false; 
            return; 
        }
        if (!/[A-Z]/.test(contrasena)) { 
            msg.textContent = 'La contraseña debe tener al menos 1 mayúscula.'; 
            msg.classList.add('error');
            formBtn.disabled = false; 
            return; 
        }
        if (!/\d/.test(contrasena)) { 
            msg.textContent = 'La contraseña debe tener al menos 1 número.'; 
            msg.classList.add('error');
            formBtn.disabled = false; 
            return; 
        }

        const data = { nombre, correo, contrasena, documento, edad: '', telefono: document.getElementById('clientPhone') ? document.getElementById('clientPhone').value : '' };

        // Adjuntar datos de reserva obligatoria
        data.cabana_id = cabanaSelect.value;
        data.fecha_llegada = document.getElementById('clientLlegada').value;
        data.fecha_salida = document.getElementById('clientSalida').value;
        
        if (!data.cabana_id || !data.fecha_llegada || !data.fecha_salida) {
            msg.textContent = 'Completa todos los campos de la reserva manual.';
            msg.classList.add('error');
            formBtn.disabled = false;
            return;
        }

        // Guardar sesión actual del admin
        const adminJwt = localStorage.getItem('diamante_jwt');
        const adminRole = localStorage.getItem('diamante_role');
        const adminNombre = localStorage.getItem('diamante_nombre');

        // 1. Registrar usuario
        const res = await registerUser(data);
        if(res.success) {
            // 2. Login automático con el nuevo usuario
            const loginRes = await login(correo, contrasena);
            if (loginRes.success) {
                // 3. Crear reserva usando el JWT del huésped
                const reservaData = {
                    cabana_id: data.cabana_id,
                    huesped: nombre,
                    llegada: data.fecha_llegada,
                    salida: data.fecha_salida,
                    monto: 0,
                    metodoPago: 'Por definir'
                };
                const reservaRes = await reserveCabana(reservaData);
                // 4. Restaurar sesión del admin
                localStorage.setItem('diamante_jwt', adminJwt);
                localStorage.setItem('diamante_role', adminRole);
                localStorage.setItem('diamante_nombre', adminNombre);

                if (reservaRes.success) {
                    renderClients();
                    form.reset();
                    msg.textContent = `Cliente "${nombre}" y su reserva fueron registrados exitosamente.`;
                    msg.classList.add('success');
                } else {
                    msg.textContent = `Cliente registrado, pero error al crear la reserva: ${reservaRes.mensaje || 'Error'}`;
                    msg.classList.add('error');
                }
            } else {
                // No se pudo loguear el huésped
                localStorage.setItem('diamante_jwt', adminJwt);
                localStorage.setItem('diamante_role', adminRole);
                localStorage.setItem('diamante_nombre', adminNombre);
                msg.textContent = `Cliente registrado, pero no se pudo crear la reserva (falló login automático).`;
                msg.classList.add('error');
            }
        } else {
            msg.textContent = res.mensaje || 'Error al registrar.';
            msg.classList.add('error');
        }
        formBtn.disabled = false;
    });
};

const initAdminTabs = () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.dashboard-tab');
    if(tabs.length === 0) return;

    tabs.forEach(btn => btn.addEventListener('click', () => {
        tabs.forEach(item => item.classList.remove('active'));
        sections.forEach(sec => sec.classList.remove('active'));
        const target = document.getElementById(btn.dataset.tab);
        if(target) target.classList.add('active');
        btn.classList.add('active');
        // Recargar datos al cambiar de pestaña
        if(btn.dataset.tab === 'reservas' || btn.dataset.tab === 'pagos') renderReservasYPagos();
        if(btn.dataset.tab === 'calendario') renderCalendar();
        if(btn.dataset.tab === 'usuarios') renderUsuariosTab();
    }));

    const cabanaRows = document.getElementById('cabanaRows');
    const editContainer = document.getElementById('editCabanaFormContainer');
    const editForm = document.getElementById('editCabanaForm');
    let currentData = [];
    let currentCabanaPhotos = [];

    const renderAdminTable = (data) => {
        if(!cabanaRows) return;
        cabanaRows.innerHTML = '';
        data.forEach(c => {
            const row = document.createElement('tr');
            const badgeClass = c.estado === 'Disponible' ? 'success' : (c.estado === 'Ocupado' ? 'danger' : 'primary');
            row.innerHTML = `<td>${c.nombre}</td><td>${c.capacidad}</td><td style="color: var(--${badgeClass})">${c.estado}</td><td>${c.precio}</td><td><button class="btn-ghost edit-btn" data-id="${c._id}">Editar</button></td>`;
            cabanaRows.appendChild(row);
        });

        currentCabanaPhotos = [];
        const renderCabanaPhotos = () => {
            const grid = document.getElementById('cabanaPhotoGrid');
            if(!grid) return;
            if(currentCabanaPhotos.length === 0) {
                grid.innerHTML = '<span style="color:var(--text-muted); font-size:0.9rem;">No hay fotos en esta cabaña.</span>';
                return;
            }
            grid.innerHTML = currentCabanaPhotos.map((url, i) => `
                <div style="position:relative; width:80px; height:80px; border-radius:8px; overflow:hidden; border:1px solid var(--glass-border);">
                    <img src="${url}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='images/placeholder.png'">
                    <button type="button" class="remove-photo-btn" data-index="${i}" style="position:absolute; top:2px; right:2px; background:var(--danger); color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:12px; cursor:pointer;">×</button>
                </div>
            `).join('');

            document.querySelectorAll('.remove-photo-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    const i = parseInt(e.target.dataset.index);
                    currentCabanaPhotos.splice(i, 1);
                    renderCabanaPhotos();
                });
            });
        };

        const addPhotoBtn = document.getElementById('addCabanaPhotoBtn');
        if(addPhotoBtn) {
            addPhotoBtn.addEventListener('click', () => {
                const url = document.getElementById('newPhotoUrl').value.trim();
                if(url) {
                    currentCabanaPhotos.push(url);
                    document.getElementById('newPhotoUrl').value = '';
                    renderCabanaPhotos();
                }
            });
        }

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const cabana = currentData.find(x => x._id === id);
                if(cabana && editContainer) {
                    editContainer.style.display = 'block';
                    document.getElementById('editCabanaId').value = cabana._id;
                    document.getElementById('editCabanaName').value = cabana.nombre;
                    document.getElementById('editCabanaType').value = cabana.tipo;
                    document.getElementById('editCabanaPrice').value = cabana.precio;
                    document.getElementById('editCabanaCapacity').value = cabana.capacidad;
                    document.getElementById('editCabanaDesc').value = cabana.descripcion;
                    document.getElementById('editCabanaTitle').textContent = `Editando: ${cabana.nombre}`;
                    
                    currentCabanaPhotos = cabana.fotos ? [...cabana.fotos] : [];
                    renderCabanaPhotos();
                    
                    editContainer.scrollIntoView({behavior: 'smooth', block: 'center'});
                }
            });
        });
    };

    if(cabanaRows) {
        cabanaRows.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando inventario...</td></tr>';
        getCabanas().then(data => {
            currentData = data;
            renderAdminTable(currentData);
        });
    }

    const addCabanaBtn = document.getElementById('addCabana');
    if (addCabanaBtn) {
        addCabanaBtn.addEventListener('click', () => {
            if (editContainer) {
                editContainer.style.display = 'block';
                document.getElementById('editCabanaId').value = 'new';
                document.getElementById('editCabanaName').value = '';
                document.getElementById('editCabanaType').value = 'Estándar';
                document.getElementById('editCabanaPrice').value = '';
                document.getElementById('editCabanaCapacity').value = '2';
                document.getElementById('editCabanaDesc').value = '';
                document.getElementById('editCabanaTitle').textContent = 'Agregar Nueva Cabaña';
                
                currentCabanaPhotos = [];
                renderCabanaPhotos();
                
                editContainer.scrollIntoView({behavior: 'smooth', block: 'center'});
            }
        });
    }

    if(editForm) {
        document.getElementById('cancelEditCabana').addEventListener('click', () => {
            editContainer.style.display = 'none';
        });
        editForm.addEventListener('submit', async e => {
            e.preventDefault();
            const btn = editForm.querySelector('button[type="submit"]');
            btn.textContent = 'Guardando...';
            btn.disabled = true;

            await new Promise(r => setTimeout(r, 100));

            const idVal = document.getElementById('editCabanaId').value;
            
            let rawPrice = document.getElementById('editCabanaPrice').value;
            rawPrice = rawPrice.replace(/[^0-9.-]+/g, '');
            const numPrice = parseFloat(rawPrice) || 0;
            
            if(idVal === 'new') {
                const newCabana = {
                    nombre: document.getElementById('editCabanaName').value,
                    tipo: document.getElementById('editCabanaType').value,
                    precio: numPrice,
                    capacidad: parseInt(document.getElementById('editCabanaCapacity').value) || 2,
                    descripcion: document.getElementById('editCabanaDesc').value,
                    fotos: [...currentCabanaPhotos],
                    estado: 'Disponible'
                };
                await createCabana(newCabana);
                alert('Cabaña agregada correctamente.');
            } else {
                const id = idVal;
                const idx = currentData.findIndex(x => x._id === id);
                if(idx >= 0) {
                    currentData[idx].nombre = document.getElementById('editCabanaName').value;
                    currentData[idx].tipo = document.getElementById('editCabanaType').value;
                    currentData[idx].precio = numPrice;
                    currentData[idx].capacidad = parseInt(document.getElementById('editCabanaCapacity').value) || 2;
                    currentData[idx].descripcion = document.getElementById('editCabanaDesc').value;
                    currentData[idx].fotos = [...currentCabanaPhotos];
                    
                    await saveCabanas(currentData[idx]);
                    alert('Cabaña actualizada correctamente y guardada.');
                }
            }

            // Recargar datos desde la base de datos para asegurar consistencia
            currentData = await getCabanas();
            renderAdminTable(currentData);

            btn.textContent = 'Guardar Cambios';
            btn.disabled = false;
            editContainer.style.display = 'none';
        });
    }

    const updateReservaEstado = async (id, estado) => {
        await fetch(`${API}/reservas/${id}/estado`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ estado })
        });
    };

    const updatePagoEstado = async (id) => {
        await fetch(`${API}/reservas/${id}/pago`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ pago_estado: 'Pagado' })
        });
    };

    const renderReservasYPagos = async () => {
        const rList = await getReservations();
        
        // Actualizar tarjetas de Totales
        const act = Array.isArray(rList) ? rList.filter(x => x.estado === 'Activa').length : 0;
        const sol = Array.isArray(rList) ? rList.filter(x => x.estado === 'Solicitada').length : 0;
        const can = Array.isArray(rList) ? rList.filter(x => x.estado === 'Cancelada').length : 0;
        
        const actEl = document.getElementById('activeBookings');
        const solEl = document.getElementById('bookingRequests');
        const canEl = document.getElementById('canceledBookings');
        
        if(actEl) actEl.textContent = act;
        if(solEl) solEl.textContent = sol;
        if(canEl) canEl.textContent = can;
        
        // Render Tabla Reservas con acciones
        const tbodyRes = document.getElementById('reservaRows');
        if(tbodyRes) {
            if (!Array.isArray(rList) || rList.length === 0) {
                tbodyRes.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No hay reservas registradas.</td></tr>';
            } else {
                tbodyRes.innerHTML = rList.map(r => `
                    <tr>
                        <td style="font-weight:600; color:var(--primary);">${r.codigo}</td>
                        <td>${r.huesped}</td>
                        <td>${r.cabana_nombre || '-'}</td>
                        <td style="font-size:0.9rem;">${r.fecha_llegada} &rarr; ${r.fecha_salida}</td>
                        <td>${r.pago_estado === 'Pagado' ? '<span style="color:var(--success);">Pagado</span>' : '<span style="color:var(--danger);">Pendiente</span>'}</td>
                        <td>
                            <select class="estado-select" data-id="${r._id}" style="background:rgba(0,0,0,0.4); color:white; border:1px solid var(--glass-border); border-radius:8px; padding:0.3rem 0.5rem; font-size:0.85rem;">
                                <option value="Solicitada" ${r.estado==='Solicitada'?'selected':''}>Solicitada</option>
                                <option value="Activa" ${r.estado==='Activa'?'selected':''}>Activa</option>
                                <option value="Completada" ${r.estado==='Completada'?'selected':''}>Completada</option>
                                <option value="Cancelada" ${r.estado==='Cancelada'?'selected':''}>Cancelada</option>
                            </select>
                        </td>
                        <td style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                            <button class="btn-ghost save-estado-btn" data-id="${r._id}" style="padding:0.3rem 0.7rem; font-size:0.8rem;">Guardar</button>
                            ${r.pago_estado !== 'Pagado' ? `<button class="btn-primary mark-paid-btn" data-id="${r._id}" style="padding:0.3rem 0.7rem; font-size:0.8rem;">Marcar Pagado</button>` : ''}
                        </td>
                    </tr>
                `).join('');

                // Listener: guardar estado
                tbodyRes.querySelectorAll('.save-estado-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const id = btn.dataset.id;
                        const select = tbodyRes.querySelector(`.estado-select[data-id="${id}"]`);
                        btn.textContent = 'Guardando...';
                        btn.disabled = true;
                        await updateReservaEstado(id, select.value);
                        await renderReservasYPagos();
                    });
                });

                // Listener: marcar pagado
                tbodyRes.querySelectorAll('.mark-paid-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        btn.textContent = 'Procesando...';
                        btn.disabled = true;
                        await updatePagoEstado(btn.dataset.id);
                        await renderReservasYPagos();
                    });
                });
            }
        }
        
        // Render Tabla Pagos
        const tbodyPagos = document.getElementById('paymentRows');
        if(tbodyPagos) {
            if (!Array.isArray(rList) || rList.length === 0) {
                tbodyPagos.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No hay registros de pago.</td></tr>';
            } else {
                tbodyPagos.innerHTML = rList.map(r => `
                    <tr>
                        <td style="font-weight:600;">${r.codigo}</td>
                        <td>${r.huesped}</td>
                        <td>$${r.monto || 0}</td>
                        <td>${r.cabana_nombre || '-'}</td>
                        <td>${r.metodo_pago || '-'}</td>
                        <td>${r.pago_estado === 'Pagado' ? '<span style="color:var(--success);">Completado</span>' : '<span style="color:var(--danger);">Pendiente</span>'}</td>
                        <td>${r.pago_estado !== 'Pagado' ? `<button class="btn-primary pay-btn" data-id="${r._id}" style="padding:0.3rem 0.8rem; font-size:0.8rem;">Marcar Pagado</button>` : '<span style="color:var(--text-muted); font-size:0.85rem;">✔ Completado</span>'}</td>
                    </tr>
                `).join('');

                tbodyPagos.querySelectorAll('.pay-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        btn.textContent = 'Procesando...';
                        btn.disabled = true;
                        await updatePagoEstado(btn.dataset.id);
                        await renderReservasYPagos();
                    });
                });
            }
        }
    };
    renderReservasYPagos();

    let currentMonthDate = new Date();
    currentMonthDate.setDate(1);

    const renderCalendar = async () => {
        const grid = document.getElementById('calendarInteractiveGrid');
        if(!grid) return;
        
        const allCabanas = currentData.length ? currentData : await getCabanas();
        const reservations = await getReservations();
        
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const mDisplay = document.getElementById('calendarMonthDisplay');
        if(mDisplay) mDisplay.textContent = `${monthNames[currentMonthDate.getMonth()]} ${currentMonthDate.getFullYear()}`;
        
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay(); // 0(Dom) to 6(Sab)
        
        // CSS Grid nativo para el formato clásico
        let htmlStr = `<div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:1rem; width:100%;">`;
        
        // Días de la semana
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayNames.forEach(d => {
            htmlStr += `<div style="text-align:center; font-weight:700; color:var(--primary); font-size:1.1rem; text-transform:uppercase; letter-spacing:1px; background:rgba(0,0,0,0.3); border-radius:12px; padding:0.8rem 0; border:1px solid var(--glass-border);">${d}</div>`;
        });
        
        // Espacios vacíos antes del primer día del mes
        for(let i=0; i<firstDayIndex; i++) {
            htmlStr += `<div style="border-radius:12px; background:rgba(255,255,255,0.01);"></div>`;
        }
        
        // Días del mes
        for(let day=1; day<=daysInMonth; day++) {
            const yyyy = year;
            const mm = String(month + 1).padStart(2,'0');
            const dd = String(day).padStart(2,'0');
            const currentDateStr = `${yyyy}-${mm}-${dd}`;
            
            let dayHtml = `<div style="background:rgba(0,0,0,0.2); border:1px solid var(--glass-border); border-radius:12px; padding:0.8rem; display:flex; flex-direction:column; gap:0.4rem; min-height:120px;">
                <div style="text-align:right; font-weight:700; color:rgba(255,255,255,0.8); font-size:1.1rem; margin-bottom:0.5rem;">${day}</div>`;
                
            allCabanas.forEach(cab => {
                let res = Array.isArray(reservations) ? reservations.find(r => 
                    String(r.cabana_id) === String(cab._id || cab.id) && 
                    currentDateStr >= r.fecha_llegada && 
                    currentDateStr <= r.fecha_salida) : null;
                    
                // Usamos colores y clases base ya existentes, pero adaptados al formato compacto
                if(res) {
                    if(res.estado === 'Activa') {
                        dayHtml += `<div class="calendar-card booked" title="Reservado por ${res.huesped}" style="min-height:auto; padding:0.4rem 0.6rem; margin-bottom:0; flex-direction:row; justify-content:space-between; align-items:center;">
                            <span class="calendar-card-title" style="margin:0; font-size:0.75rem;">${cab.nombre}</span><span style="font-size:0.6rem;">${res.huesped.split(' ')[0]}</span>
                        </div>`;
                    } else if(res.estado === 'Solicitada' || res.estado === 'Pendiente') {
                        dayHtml += `<div class="calendar-card pending" title="Reserva Solicitada" style="min-height:auto; padding:0.4rem 0.6rem; margin-bottom:0; flex-direction:row; justify-content:space-between; align-items:center;">
                            <span class="calendar-card-title" style="margin:0; font-size:0.75rem;">${cab.nombre}</span><span style="font-size:0.6rem;">Pendiente</span>
                        </div>`;
                    }
                    // Si está disponible no mostramos nada para no abarrotar el recuadro
                }
            });
            
            dayHtml += `</div>`;
            htmlStr += dayHtml;
        }
        
        htmlStr += `</div>`;
        grid.innerHTML = htmlStr;
        // Restaurar overflow normal en lugar de flex
        grid.style.display = 'block'; 
        grid.style.overflowX = 'visible';
    };
    
    const btnPrev = document.getElementById('prevMonthBtn');
    const btnNext = document.getElementById('nextMonthBtn');
    if(btnPrev && btnNext) {
        // Remover listeners anteriores por si se llama doble
        const newPrev = btnPrev.cloneNode(true);
        const newNext = btnNext.cloneNode(true);
        btnPrev.parentNode.replaceChild(newPrev, btnPrev);
        btnNext.parentNode.replaceChild(newNext, btnNext);
        
        newPrev.addEventListener('click', () => {
            currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
            renderCalendar();
        });
        newNext.addEventListener('click', () => {
            currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
            renderCalendar();
        });
    }

    renderCalendar();
    
    const userTabs = document.querySelectorAll('.tab-btn');
    if(userTabs.length) {
        userTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                if(btn.dataset.tab === 'usuarios') renderUsuariosTab();
            });
        });
        renderUsuariosTab(); // run once inside tabs logic just in case it's active
    }
};

const renderUsuariosTab = async () => {
    const tableBody = document.getElementById('userRows');
    if (!tableBody) return;
    
    const users = await getRegisteredUsers();
    const reservas = await getReservations();
    
    if (!Array.isArray(users) || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay usuarios registrados.</td></tr>';
        return;
    }
    
    tableBody.innerHTML = users.map(u => {
        const pastRes = Array.isArray(reservas) ? reservas.filter(r =>
            r.huesped && u.nombre && r.huesped.toLowerCase().includes(u.nombre.toLowerCase())
        ) : [];
        const resCount = pastRes.length;
        const historialBadge = resCount > 0
            ? `<span style="background:var(--primary); color:black; padding:2px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">${resCount} Reservas (Habitual)</span>`
            : '<span style="color:var(--text-muted); font-size:0.8rem;">Sin historial</span>';
        return `
            <tr>
                <td>${u.nombre || '-'}</td>
                <td>${u.correo}</td>
                <td>${historialBadge}</td>
                <td>Cliente Plataforma</td>
            </tr>
        `;
    }).join('');
};

const initUserDashboard = async () => {
    // 1. Cargar sus reservas
    const misReservas = await getMisReservas();
    
    const act = Array.isArray(misReservas) ? misReservas.filter(r => r.estado !== 'Cancelada').length : 0;
    
    // Próxima llegada (la reserva activa más cercana en el futuro)
    let prox = '-';
    if(Array.isArray(misReservas) && misReservas.length > 0) {
        const futuras = misReservas.filter(r => r.estado !== 'Cancelada' && new Date(r.fecha_llegada) >= new Date()).sort((a,b) => new Date(a.fecha_llegada) - new Date(b.fecha_llegada));
        if(futuras.length > 0) {
            prox = futuras[0].fecha_llegada;
        }
    }
    
    const elAct = document.getElementById('userActive');
    const elProx = document.getElementById('userNext');
    if(elAct) elAct.textContent = act;
    if(elProx) elProx.textContent = prox;
    
    const container = document.getElementById('userReservations');
    if(container) {
        if(!Array.isArray(misReservas) || misReservas.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding: 2rem;">No tienes reservas en este momento.</p>';
        } else {
            container.innerHTML = misReservas.map(r => `
                <article class="reservation-card" style="margin-bottom:1rem; padding:1.5rem; background:rgba(255,255,255,0.05); border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
                    <h3 style="margin:0 0 0.5rem 0; color:var(--primary);">${r.cabana_nombre || 'Cabaña'} (${r.codigo})</h3>
                    <p style="margin:0.2rem 0;"><strong>Fecha:</strong> ${r.fecha_llegada} a ${r.fecha_salida}</p>
                    <p style="margin:0.2rem 0;"><strong>Estado:</strong> <span style="color:${r.estado === 'Cancelada' ? 'var(--danger)' : 'var(--success)'}">${r.estado}</span></p>
                </article>
            `).join('');
        }
    }

    const searchForm = document.getElementById('searchAvailability');
    const results = document.getElementById('searchResults');
    if (searchForm) {
        searchForm.addEventListener('submit', async e => {
            e.preventDefault();
            const btn = searchForm.querySelector('button');
            btn.disabled = true;
            btn.textContent = 'Buscando...';
            results.innerHTML = '<p>Consultando base de datos...</p>';
            
            const tipo = document.getElementById('searchType').value;
            const cabanasLocal = await getCabanas();
            const fit = cabanasLocal.filter(c => c.tipo === tipo || tipo === 'todas');
            
            results.innerHTML = fit.map(c => `
                <article class="card">
                    <h3>${c.nombre}</h3><p>${c.descripcion}</p><p><strong>Tipo:</strong> ${c.tipo}</p><p><strong>Precio:</strong> ${c.precio}</p>
                    <a href="cabanas.html" class="btn-primary" style="display:inline-block; margin-top: 1rem; width: 100%; text-align:center; text-decoration:none;">Ver Detalles</a>
                </article>`).join('');
            btn.disabled = false;
            btn.textContent = 'Buscar';
        });
    }
};

// --- Entrypoint (main.js) ---
document.addEventListener('DOMContentLoaded', () => {
    // Nav dinámico: SIEMPRE se inicializa en todas las páginas
    initNavAuth();

    if (document.getElementById('cabañaCards')) initHome();
    if (document.getElementById('cabanasPageList')) initCabanasPage();
    if (document.getElementById('loginForm')) initLogin();
    if (document.getElementById('registerForm')) initRegister();
    if (document.querySelector('.admin-nav')) initAdminTabs();
    if (document.getElementById('adminAccountsSection')) initAdminAccounts();
    if (document.getElementById('clientForm')) initClientManagement();
    if (document.querySelector('.user-dashboard')) initUserDashboard();

    // Protección de admin-dashboard
    const isAdminDashboard = window.location.pathname.includes('admin-dashboard');
    if (isAdminDashboard) {
        if (!isAuthenticated()) { window.location.href = 'login.html'; return; }
        if (!isAdmin()) { alert('Acceso denegado.'); window.location.href = 'index.html'; return; }
    }

    // Protección de user-dashboard
    const isUserDashboard = window.location.pathname.includes('user-dashboard');
    if (isUserDashboard && !isAuthenticated()) {
        sessionStorage.setItem('reserva_returnTo', 'user-dashboard.html');
        window.location.href = 'login.html';
        return;
    }
});
