// Módulo para manejar la Autenticación (JWT Simulado)

export const login = async (correo, password, rol) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (!correo || !password) {
                resolve({ success: false, mensaje: 'Datos incompletos.' });
                return;
            }
            
            // Simulación de JWT
            const payload = { correo, rol, exp: Date.now() + 86400000 };
            const fakeJwt = btoa(JSON.stringify(payload));
            
            localStorage.setItem('diamante_jwt', fakeJwt);
            localStorage.setItem('diamante_role', rol);
            
            resolve({ success: true, token: fakeJwt, role: rol });
        }, 800);
    });
};

export const logout = () => {
    localStorage.removeItem('diamante_jwt');
    localStorage.removeItem('diamante_role');
    window.location.href = 'index.html';
};

export const isAuthenticated = () => {
    const token = localStorage.getItem('diamante_jwt');
    return !!token;
};

export const getUserRole = () => {
    return localStorage.getItem('diamante_role');
};
