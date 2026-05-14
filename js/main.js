import { initHome, initLogin, initRegister, initAdminTabs, initUserDashboard } from './ui.js';
import { logout, isAuthenticated } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Detección inteligente de la vista actual e inicialización de lógica
    if (document.getElementById('cabañaCards')) initHome();
    if (document.getElementById('loginForm')) initLogin();
    if (document.getElementById('registerForm')) initRegister();
    if (document.querySelector('.admin-nav')) initAdminTabs();
    if (document.querySelector('.user-dashboard')) initUserDashboard();

    // 2. Comportamiento en rutas protegidas (simulado)
    const isDashboard = window.location.pathname.includes('dashboard');
    if (isDashboard && !isAuthenticated()) {
        // Redirigir a login si intenta entrar a dashboard sin token JWT (simulado)
        // Por seguridad, enviamos a login (descomentar en producción futura)
        // window.location.href = 'login.html';
        console.warn('Usuario no autenticado viendo Dashboard (modo dev).');
    }

    // 3. Lógica globa: Logout dinámico
    document.body.addEventListener('click', e => {
        // Si el click fue en algo que tenga href="login.html" y diga "Cerrar sesión"
        if (e.target.tagName === 'A' && (e.target.textContent.includes('Cerrar sesión'))) {
            e.preventDefault();
            logout();
        }
    });
});
