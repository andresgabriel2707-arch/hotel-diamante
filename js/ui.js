import { getCabanas, reserveCabana, registerUser } from './api.js';
import { login } from './auth.js';

export const initHome = async () => {
    const cards = document.getElementById('cabañaCards');
    const filter = document.getElementById('filterType');
    let allCabanas = [];

    const renderCards = (lista) => {
        if (!cards) return;
        cards.innerHTML = '';
        lista.forEach(c => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <h3>${c.nombre}</h3>
                <p>${c.descripcion}</p>
                <p><strong>Tipo:</strong> ${c.tipo}</p>
                <p><strong>Estado:</strong> <span style="color: ${c.estado === 'Disponible' ? 'var(--success)' : 'var(--danger)'}">${c.estado}</span></p>
                <p><strong>Precio:</strong> ${c.precio}</p>
            `;
            cards.appendChild(card);
        });
    };

    if (cards && filter) {
        cards.innerHTML = '<p style="text-align:center; width:100%;">Cargando disponibilidad...</p>';
        allCabanas = await getCabanas();
        renderCards(allCabanas);

        filter.addEventListener('change', () => {
            const tipo = filter.value;
            const filtradas = allCabanas.filter(c => tipo === 'todas' || c.tipo === tipo);
            renderCards(filtradas);
        });
    }

    const reserveForm = document.getElementById('reserveForm');
    if (reserveForm) {
        reserveForm.addEventListener('submit', async e => {
            e.preventDefault();
            const btn = reserveForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Procesando...';
            btn.disabled = true;
            
            await reserveCabana({});
            
            btn.textContent = originalText;
            btn.disabled = false;
            alert('Reserva enviada con éxito. Revisaremos disponibilidad y te contactaremos.');
            reserveForm.reset();
        });
    }
};

export const initLogin = () => {
    const form = document.getElementById('loginForm');
    const message = document.getElementById('loginMessage');
    if (!form) return;
    
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;
        const btn = form.querySelector('button');
        
        btn.disabled = true;
        btn.textContent = 'Cargando...';
        message.textContent = 'Autenticando de forma segura...';
        message.className = 'message';
        
        const res = await login(email, pass, role);
        if (res.success) {
            message.textContent = 'Ingreso exitoso con JWT. Redirigiendo...';
            message.classList.add('success');
            const redirect = res.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
            setTimeout(() => window.location.href = redirect, 800);
        } else {
            message.textContent = res.mensaje || 'Error al iniciar sesión.';
            message.classList.add('error');
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    });
};

export const initRegister = () => {
    const form = document.getElementById('registerForm');
    const message = document.getElementById('registerMessage');
    if (!form) return;
    
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = form.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Procesando...';
        message.textContent = '';
        message.className = 'message';

        const usuario = {
            nombre: document.getElementById('registerName').value,
            correo: document.getElementById('registerEmail').value,
            contrasena: document.getElementById('registerPassword').value,
            edad: document.getElementById('registerAge').value,
            documento: document.getElementById('registerDocument').value,
        };

        try {
            const data = await registerUser(usuario);
            message.textContent = data.mensaje || 'Registro completado correctamente.';
            message.classList.add('success');
            form.reset();
        } catch (error) {
            message.textContent = 'Error de conexión. Intente de nuevo.';
            message.classList.add('error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Registrar';
        }
    });
};

export const initAdminTabs = () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.dashboard-tab');
    if(tabs.length === 0) return;

    tabs.forEach(btn => btn.addEventListener('click', () => {
        tabs.forEach(item => item.classList.remove('active'));
        sections.forEach(sec => sec.classList.remove('active'));
        const target = document.getElementById(btn.dataset.tab);
        if(target) target.classList.add('active');
        btn.classList.add('active');
    }));

    const cabanaRows = document.getElementById('cabanaRows');
    if(cabanaRows) {
        cabanaRows.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando inventario...</td></tr>';
        getCabanas().then(data => {
            cabanaRows.innerHTML = '';
            data.forEach(c => {
                const row = document.createElement('tr');
                const badgeClass = c.estado === 'Disponible' ? 'success' : (c.estado === 'Ocupado' ? 'danger' : 'primary');
                row.innerHTML = `
                    <td>${c.nombre}</td>
                    <td>${c.tipo}</td>
                    <td style="color: var(--${badgeClass})">${c.estado}</td>
                    <td>${c.precio}</td>
                    <td><button class="btn-ghost">Editar</button></td>
                `;
                cabanaRows.appendChild(row);
            });
        });
    }

    const calendar = document.getElementById('calendarGrid');
    if (calendar) {
        calendar.innerHTML = '';
        const estados = ['booked', 'available', 'pending'];
        for (let i = 1; i <= 15; i++) {
            const cell = document.createElement('div');
            const estado = estados[Math.floor(Math.random() * estados.length)];
            cell.className = \`calendar-cell \${estado}\`;
            cell.textContent = \`Abr \${i}\`;
            calendar.appendChild(cell);
        }
    }
};

export const initUserDashboard = () => {
    const searchForm = document.getElementById('searchAvailability');
    const results = document.getElementById('searchResults');
    
    if (searchForm) {
        searchForm.addEventListener('submit', async e => {
            e.preventDefault();
            const btn = searchForm.querySelector('button');
            btn.disabled = true;
            btn.textContent = 'Buscando...';
            results.innerHTML = '<p>Consultando base de datos...</p>';
            
            const cabanas = await getCabanas();
            
            results.innerHTML = cabanas.map(c => \`
                <article class="card">
                    <h3>\${c.nombre}</h3>
                    <p>\${c.descripcion}</p>
                    <p><strong>Tipo:</strong> \${c.tipo}</p>
                    <p><strong>Precio:</strong> \${c.precio}</p>
                    <button class="btn-primary" style="margin-top: 1rem; width: 100%;">Reservar ahora</button>
                </article>
            \`).join('');
            
            btn.disabled = false;
            btn.textContent = 'Buscar';
        });
    }
};
