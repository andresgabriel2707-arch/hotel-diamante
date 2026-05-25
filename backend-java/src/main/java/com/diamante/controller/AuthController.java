package com.diamante.controller;

import com.diamante.dao.UsuarioDAO;
import com.diamante.dao.ReservaDAO;
import com.diamante.model.Usuario;
import com.diamante.model.Reserva;
import com.diamante.util.JsonUtil;
import com.diamante.util.JwtUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controlador HTTP para las rutas de autenticación (/api/auth/*).
 * Maneja registro, login, listado de usuarios y eliminación.
 */
public class AuthController {

    private static final UsuarioDAO usuarioDAO = new UsuarioDAO();

    // ──────────────────────────────────────────────────────────
    //  POST /api/auth/register
    // ──────────────────────────────────────────────────────────
    public static HttpHandler register = (HttpExchange exchange) -> {
        if (!"POST".equals(exchange.getRequestMethod())) {
            JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false, "mensaje", "Método no permitido."));
            return;
        }
        try {
            JsonObject body = JsonUtil.leerBody(exchange);
            String nombre = JsonUtil.getString(body, "nombre", null);
            String correo = JsonUtil.getString(body, "correo", null);
            String contrasena = JsonUtil.getString(body, "contrasena", null);

            if (nombre == null || correo == null || contrasena == null) {
                JsonUtil.enviarRespuesta(exchange, 400, Map.of("success", false, "mensaje", "Nombre, correo y contraseña son obligatorios."));
                return;
            }

            // Verificar si el correo ya existe
            if (usuarioDAO.buscarPorCorreo(correo) != null) {
                JsonUtil.enviarRespuesta(exchange, 409, Map.of("success", false, "mensaje", "Ese correo ya está registrado."));
                return;
            }

            // Hash de contraseña con BCrypt
            String hash = BCrypt.hashpw(contrasena, BCrypt.gensalt(10));

            Usuario usuario = new Usuario();
            usuario.setNombre(nombre);
            usuario.setCorreo(correo.toLowerCase());
            usuario.setContrasena(hash);
            usuario.setEdad(JsonUtil.getInt(body, "edad", 0));
            usuario.setDocumento(JsonUtil.getString(body, "documento", ""));
            usuario.setRol("cliente");

            int cabanaId = JsonUtil.getInt(body, "cabana_id", 0);
            String llegada = JsonUtil.getString(body, "fecha_llegada", null);
            String salida = JsonUtil.getString(body, "fecha_salida", null);

            // Verificamos disponibilidad antes de registrar usuario
            ReservaDAO reservaDAO = new ReservaDAO();
            if (cabanaId > 0 && llegada != null && salida != null) {
                if (!reservaDAO.estaDisponible(cabanaId, llegada, salida)) {
                    JsonUtil.enviarRespuesta(exchange, 409, Map.of("success", false, "mensaje", "Las fechas seleccionadas ya están ocupadas para esta cabaña."));
                    return;
                }
            }

            int newUserId = usuarioDAO.insertar(usuario);

            if (cabanaId > 0 && llegada != null && salida != null) {
                int clienteId = usuarioDAO.obtenerClienteId(newUserId);
                if (clienteId != -1) {
                    String codigo = "RES-" + String.valueOf(System.currentTimeMillis()).substring(7);
                    Reserva reserva = new Reserva();
                    reserva.setCodigo(codigo);
                    reserva.setClienteId(clienteId);
                    reserva.setCabanaId(cabanaId);
                    reserva.setHuesped(nombre);
                    reserva.setFechaLlegada(llegada);
                    reserva.setFechaSalida(salida);
                    reserva.setEstado("Activa"); // Estado Activa para que se muestre en el calendario
                    reserva.setPagoEstado("Pendiente");
                    reserva.setTotal(0);
                    reserva.setMetodoPago("Agencia / Externa");

                    reservaDAO.insertar(reserva);
                }
            }

            JsonUtil.enviarRespuesta(exchange, 200, Map.of("success", true, "mensaje", "Registro completado. Ya puedes iniciar sesión."));

        } catch (Exception e) {
            System.err.println("Error en register: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false, "mensaje", "Error interno."));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  POST /api/auth/login
    // ──────────────────────────────────────────────────────────
    public static HttpHandler login = (HttpExchange exchange) -> {
        if (!"POST".equals(exchange.getRequestMethod())) {
            JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false, "mensaje", "Método no permitido."));
            return;
        }
        try {
            JsonObject body = JsonUtil.leerBody(exchange);
            String correo = JsonUtil.getString(body, "correo", null);
            String contrasena = JsonUtil.getString(body, "contrasena", null);

            if (correo == null || contrasena == null) {
                JsonUtil.enviarRespuesta(exchange, 400, Map.of("success", false, "mensaje", "Correo y contraseña son obligatorios."));
                return;
            }

            Usuario user = usuarioDAO.buscarPorCorreo(correo.toLowerCase());

            if (user == null || !BCrypt.checkpw(contrasena, user.getContrasena())) {
                JsonUtil.enviarRespuesta(exchange, 401, Map.of("success", false, "mensaje", "Credenciales incorrectas."));
                return;
            }

            // Generar token JWT
            String token = JwtUtil.generarToken(user.getId(), user.getCorreo(), user.getRol());

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("success", true);
            respuesta.put("token", token);
            respuesta.put("rol", user.getRol());
            respuesta.put("nombre", user.getNombre());
            JsonUtil.enviarRespuesta(exchange, 200, respuesta);

        } catch (Exception e) {
            System.err.println("Error en login: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false, "mensaje", "Error interno."));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  GET /api/auth/users (solo admin)
    // ──────────────────────────────────────────────────────────
    public static HttpHandler getUsers = (HttpExchange exchange) -> {
        if (!"GET".equals(exchange.getRequestMethod())) {
            JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false));
            return;
        }
        try {
            // Verificar token de admin
            String token = JsonUtil.extraerToken(exchange);
            String rol = JwtUtil.getRolFromToken(token);
            if (!"admin".equals(rol)) {
                JsonUtil.enviarRespuesta(exchange, 403, Map.of("success", false, "mensaje", "Acceso denegado."));
                return;
            }
            List<Usuario> clientes = usuarioDAO.listarClientes();
            JsonUtil.enviarRespuesta(exchange, 200, adaptarUsuarios(clientes));
        } catch (Exception e) {
            System.err.println("Error en getUsers: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  GET /api/auth/admins (solo admin)
    // ──────────────────────────────────────────────────────────
    public static HttpHandler getAdmins = (HttpExchange exchange) -> {
        if (!"GET".equals(exchange.getRequestMethod())) {
            JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false));
            return;
        }
        try {
            String token = JsonUtil.extraerToken(exchange);
            String rol = JwtUtil.getRolFromToken(token);
            if (!"admin".equals(rol)) {
                JsonUtil.enviarRespuesta(exchange, 403, Map.of("success", false, "mensaje", "Acceso denegado."));
                return;
            }
            List<Usuario> admins = usuarioDAO.listarAdmins();
            JsonUtil.enviarRespuesta(exchange, 200, adaptarUsuarios(admins));
        } catch (Exception e) {
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  POST /api/auth/add-admin (solo admin)
    // ──────────────────────────────────────────────────────────
    public static HttpHandler addAdmin = (HttpExchange exchange) -> {
        if (!"POST".equals(exchange.getRequestMethod())) {
            JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false));
            return;
        }
        try {
            String token = JsonUtil.extraerToken(exchange);
            String rol = JwtUtil.getRolFromToken(token);
            if (!"admin".equals(rol)) {
                JsonUtil.enviarRespuesta(exchange, 403, Map.of("success", false, "mensaje", "Acceso denegado."));
                return;
            }
            JsonObject body = JsonUtil.leerBody(exchange);
            String correo = JsonUtil.getString(body, "correo", null);
            String contrasena = JsonUtil.getString(body, "contrasena", null);

            if (correo == null || contrasena == null) {
                JsonUtil.enviarRespuesta(exchange, 400, Map.of("success", false, "mensaje", "Correo y contraseña son obligatorios."));
                return;
            }

            if (usuarioDAO.buscarPorCorreo(correo) != null) {
                JsonUtil.enviarRespuesta(exchange, 409, Map.of("success", false, "mensaje", "Ese correo ya existe en el sistema."));
                return;
            }

            String hash = BCrypt.hashpw(contrasena, BCrypt.gensalt(10));
            Usuario admin = new Usuario();
            admin.setNombre("Admin");
            admin.setCorreo(correo.toLowerCase());
            admin.setContrasena(hash);
            admin.setRol("admin");
            admin.setEdad(0);
            admin.setDocumento("");
            usuarioDAO.insertar(admin);
            JsonUtil.enviarRespuesta(exchange, 200, Map.of("success", true, "mensaje", "Administrador creado correctamente."));
        } catch (Exception e) {
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false, "mensaje", "Error interno."));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  DELETE /api/auth/users/{id} y /api/auth/admins/{id}
    // ──────────────────────────────────────────────────────────
    public static HttpHandler deleteUser = (HttpExchange exchange) -> {
        if (!"DELETE".equals(exchange.getRequestMethod())) {
            JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false));
            return;
        }
        try {
            String token = JsonUtil.extraerToken(exchange);
            int adminId = JwtUtil.getIdFromToken(token);
            String rol = JwtUtil.getRolFromToken(token);
            if (!"admin".equals(rol)) {
                JsonUtil.enviarRespuesta(exchange, 403, Map.of("success", false, "mensaje", "Acceso denegado."));
                return;
            }

            // Extraer ID de la URL: /api/auth/users/5 o /api/auth/admins/5
            String path = exchange.getRequestURI().getPath();
            String[] parts = path.split("/");
            int targetId = Integer.parseInt(parts[parts.length - 1]);

            if (adminId == targetId) {
                JsonUtil.enviarRespuesta(exchange, 400, Map.of("success", false, "mensaje", "No puedes eliminarte a ti mismo."));
                return;
            }

            usuarioDAO.eliminar(targetId);
            JsonUtil.enviarRespuesta(exchange, 200, Map.of("success", true, "mensaje", "Usuario eliminado."));
        } catch (Exception e) {
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false));
        }
    };

    // Helper: adaptar campos para el frontend (_id en lugar de id)
    private static List<Map<String, Object>> adaptarUsuarios(List<Usuario> usuarios) {
        return usuarios.stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("_id", String.valueOf(u.getId()));
            m.put("nombre", u.getNombre());
            m.put("correo", u.getCorreo());
            m.put("edad", u.getEdad());
            m.put("documento", u.getDocumento());
            m.put("rol", u.getRol());
            m.put("creado_en", u.getCreadoEn());
            return m;
        }).collect(Collectors.toList());
    }
}
