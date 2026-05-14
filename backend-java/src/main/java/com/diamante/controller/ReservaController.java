package com.diamante.controller;

import com.diamante.dao.ReservaDAO;
import com.diamante.dao.UsuarioDAO;
import com.diamante.model.Reserva;
import com.diamante.util.JsonUtil;
import com.diamante.util.JwtUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador HTTP para las rutas de reservas (/api/reservas/*).
 * Adaptado al schema normalizado con tabla 'clientes' y 'estado_reserva'.
 */
public class ReservaController {

    private static final ReservaDAO reservaDAO = new ReservaDAO();
    private static final UsuarioDAO usuarioDAO = new UsuarioDAO();

    // ──────────────────────────────────────────────────────────
    //  GET /api/reservas — Listar todas (solo admin)
    // ──────────────────────────────────────────────────────────
    public static HttpHandler listar = (HttpExchange exchange) -> {
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
            List<Reserva> reservas = reservaDAO.listarTodas();
            JsonUtil.enviarRespuesta(exchange, 200, adaptarListaParaFrontend(reservas));
        } catch (Exception e) {
            System.err.println("Error listando reservas: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  GET /api/reservas/mis-reservas — Reservas del usuario logueado
    // ──────────────────────────────────────────────────────────
    public static HttpHandler misReservas = (HttpExchange exchange) -> {
        if (!"GET".equals(exchange.getRequestMethod())) {
            JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false));
            return;
        }
        try {
            String token = JsonUtil.extraerToken(exchange);
            int userId = JwtUtil.getIdFromToken(token);
            if (userId == -1) {
                JsonUtil.enviarRespuesta(exchange, 401, Map.of("success", false, "mensaje", "Token requerido."));
                return;
            }
            // Obtener el cliente_id a partir del usuario_id
            int clienteId = usuarioDAO.obtenerClienteId(userId);
            if (clienteId == -1) {
                JsonUtil.enviarRespuesta(exchange, 200, List.of()); // Sin reservas
                return;
            }
            List<Reserva> reservas = reservaDAO.listarPorCliente(clienteId);
            JsonUtil.enviarRespuesta(exchange, 200, adaptarListaParaFrontend(reservas));
        } catch (Exception e) {
            System.err.println("Error en mis-reservas: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  POST /api/reservas/check — Verificar disponibilidad
    // ──────────────────────────────────────────────────────────
    public static HttpHandler check = (HttpExchange exchange) -> {
        if (!"POST".equals(exchange.getRequestMethod())) {
            JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false));
            return;
        }
        try {
            JsonObject body = JsonUtil.leerBody(exchange);
            int cabanaId = JsonUtil.getInt(body, "cabana_id", 0);
            String llegada = JsonUtil.getString(body, "fecha_llegada", null);
            String salida = JsonUtil.getString(body, "fecha_salida", null);

            if (cabanaId == 0 || llegada == null || salida == null) {
                JsonUtil.enviarRespuesta(exchange, 400, Map.of("available", false, "mensaje", "Faltan datos."));
                return;
            }
            if (llegada.compareTo(salida) >= 0) {
                JsonUtil.enviarRespuesta(exchange, 400, Map.of("available", false, "mensaje", "La fecha de llegada debe ser anterior a la de salida."));
                return;
            }

            boolean disponible = reservaDAO.estaDisponible(cabanaId, llegada, salida);
            if (disponible) {
                JsonUtil.enviarRespuesta(exchange, 200, Map.of("available", true, "mensaje", "¡Fechas disponibles!"));
            } else {
                JsonUtil.enviarRespuesta(exchange, 200, Map.of("available", false, "mensaje", "Esas fechas ya están ocupadas para esta cabaña."));
            }
        } catch (Exception e) {
            System.err.println("Error en check: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("available", false, "mensaje", "Error interno."));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  POST /api/reservas — Crear reserva (usuario autenticado)
    // ──────────────────────────────────────────────────────────
    public static HttpHandler crear = (HttpExchange exchange) -> {
        if (!"POST".equals(exchange.getRequestMethod())) {
            JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false));
            return;
        }
        try {
            String token = JsonUtil.extraerToken(exchange);
            int userId = JwtUtil.getIdFromToken(token);
            if (userId == -1) {
                JsonUtil.enviarRespuesta(exchange, 401, Map.of("success", false, "mensaje", "Token requerido."));
                return;
            }

            // Obtener cliente_id del usuario autenticado
            int clienteId = usuarioDAO.obtenerClienteId(userId);
            if (clienteId == -1) {
                JsonUtil.enviarRespuesta(exchange, 400, Map.of("success", false, "mensaje", "No se encontró perfil de cliente."));
                return;
            }

            JsonObject body = JsonUtil.leerBody(exchange);
            int cabanaId = JsonUtil.getInt(body, "cabana_id", 0);
            String huesped = JsonUtil.getString(body, "huesped", null);
            String llegada = JsonUtil.getString(body, "fecha_llegada", null);
            String salida = JsonUtil.getString(body, "fecha_salida", null);

            if (cabanaId == 0 || huesped == null || llegada == null || salida == null) {
                JsonUtil.enviarRespuesta(exchange, 400, Map.of("success", false, "mensaje", "Faltan campos obligatorios."));
                return;
            }

            // Doble verificación anti-overbooking
            if (!reservaDAO.estaDisponible(cabanaId, llegada, salida)) {
                JsonUtil.enviarRespuesta(exchange, 409, Map.of("success", false, "mensaje", "Esas fechas ya están reservadas."));
                return;
            }

            String codigo = "RES-" + String.valueOf(System.currentTimeMillis()).substring(7);

            Reserva reserva = new Reserva();
            reserva.setCodigo(codigo);
            reserva.setClienteId(clienteId);
            reserva.setCabanaId(cabanaId);
            reserva.setHuesped(huesped);
            reserva.setFechaLlegada(llegada);
            reserva.setFechaSalida(salida);
            reserva.setEstado("Pendiente");
            reserva.setPagoEstado("Pendiente");
            reserva.setTotal(JsonUtil.getDouble(body, "monto", 0));
            reserva.setMetodoPago(JsonUtil.getString(body, "metodo_pago", "Por definir"));

            reservaDAO.insertar(reserva);

            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("codigo", codigo);
            resp.put("mensaje", "Reserva " + codigo + " creada exitosamente.");
            JsonUtil.enviarRespuesta(exchange, 200, resp);

        } catch (Exception e) {
            System.err.println("Error creando reserva: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false, "mensaje", "Error al crear reserva."));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  PATCH /api/reservas/{id}/estado — Actualizar estado (admin)
    // ──────────────────────────────────────────────────────────
    public static HttpHandler actualizarEstado = (HttpExchange exchange) -> {
        if (!"PATCH".equals(exchange.getRequestMethod())) {
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

            String path = exchange.getRequestURI().getPath();
            String[] parts = path.split("/");
            int id = Integer.parseInt(parts[3]);

            JsonObject body = JsonUtil.leerBody(exchange);
            String estado = JsonUtil.getString(body, "estado", null);

            List<String> validos = List.of("Activa", "Cancelada", "Completada", "Pendiente", "Confirmada");
            if (!validos.contains(estado)) {
                JsonUtil.enviarRespuesta(exchange, 400, Map.of("success", false, "mensaje", "Estado inválido."));
                return;
            }

            reservaDAO.actualizarEstado(id, estado);
            JsonUtil.enviarRespuesta(exchange, 200, Map.of("success", true, "mensaje", "Estado actualizado."));
        } catch (Exception e) {
            System.err.println("Error actualizando estado: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  PATCH /api/reservas/{id}/pago — Marcar pago (admin)
    // ──────────────────────────────────────────────────────────
    public static HttpHandler actualizarPago = (HttpExchange exchange) -> {
        if (!"PATCH".equals(exchange.getRequestMethod())) {
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

            String path = exchange.getRequestURI().getPath();
            String[] parts = path.split("/");
            int id = Integer.parseInt(parts[3]);

            JsonObject body = JsonUtil.leerBody(exchange);
            String pagoEstado = JsonUtil.getString(body, "pago_estado", null);

            List<String> validos = List.of("Pagado", "Pendiente");
            if (!validos.contains(pagoEstado)) {
                JsonUtil.enviarRespuesta(exchange, 400, Map.of("success", false, "mensaje", "Estado de pago inválido."));
                return;
            }

            reservaDAO.actualizarPagoEstado(id, pagoEstado);
            JsonUtil.enviarRespuesta(exchange, 200, Map.of("success", true, "mensaje", "Pago marcado como " + pagoEstado + "."));
        } catch (Exception e) {
            System.err.println("Error actualizando pago: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  Helper: adaptar campos Java al formato que espera el frontend JS
    // ──────────────────────────────────────────────────────────
    private static List<Map<String, Object>> adaptarListaParaFrontend(List<Reserva> reservas) {
        return reservas.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("_id", String.valueOf(r.getId()));
            m.put("codigo", r.getCodigo());
            m.put("user_id", String.valueOf(r.getClienteId()));
            m.put("cabana_id", String.valueOf(r.getCabanaId()));
            m.put("huesped", r.getHuesped());
            m.put("fecha_llegada", r.getFechaLlegada());
            m.put("fecha_salida", r.getFechaSalida());
            m.put("estado", r.getEstado());
            m.put("pago_estado", r.getPagoEstado());
            m.put("monto", r.getTotal());
            m.put("metodo_pago", r.getMetodoPago());
            m.put("cabana_nombre", r.getCabanaNombre() != null ? r.getCabanaNombre() : "-");
            m.put("createdAt", r.getCreadoEn());
            return m;
        }).toList();
    }
}
