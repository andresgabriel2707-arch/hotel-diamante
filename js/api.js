// Servicio API para interactuar con datos (actualmente simulado)

const cabanas = [
    { id: 1, nombre: 'Diamante 1', tipo: 'suite', estado: 'Disponible', precio: '$220/noche', descripcion: 'Cabaña con vista al lago y terraza privada.' },
    { id: 2, nombre: 'Diamante 2', tipo: 'familiar', estado: 'Ocupado', precio: '$180/noche', descripcion: 'Espacio para familia, 3 habitaciones y cocina equipada.' },
    { id: 3, nombre: 'Diamante 3', tipo: 'romantica', estado: 'Disponible', precio: '$200/noche', descripcion: 'Cabaña íntima con jacuzzi y chimenea.' },
];

export const getCabanas = async () => {
    // Simular latencia de red de 600ms
    return new Promise(resolve => setTimeout(() => resolve([...cabanas]), 600));
};

export const reserveCabana = async (data) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: 'Reserva confirmada exitosamente.' }), 800));
};

export const registerUser = async (data) => {
    // Aquí es donde iría el fetch real a php/register.php
    /*
    const response = await fetch('php/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
    */
    
    // Simulación mientras estamos solo en fase frontend
    return new Promise(resolve => setTimeout(() => resolve({ success: true, mensaje: 'Registro completado.' }), 800));
};
