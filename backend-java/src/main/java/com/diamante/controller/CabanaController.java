package com.diamante.controller;

import com.diamante.dao.CabanaDAO;
import com.diamante.model.Cabana;
import com.diamante.util.JsonUtil;
import com.diamante.util.JwtUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.util.List;
import java.util.Map;

/**
 * Controlador HTTP para las rutas de cabañas (/api/cabanas/*).
 */
public class CabanaController {

    private static final CabanaDAO cabanaDAO = new CabanaDAO();

    // ──────────────────────────────────────────────────────────
    //  GET /api/cabanas — Listar todas las cabañas (público)
    // ──────────────────────────────────────────────────────────
    public static HttpHandler listar = (HttpExchange exchange) -> {
        if (!"GET".equals(exchange.getRequestMethod())) {
            JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false));
            return;
        }
        try {
            List<Cabana> cabanas = cabanaDAO.listarTodas();
            JsonUtil.enviarRespuesta(exchange, 200, cabanas);
        } catch (Exception e) {
            System.err.println("Error listando cabañas: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  PUT /api/cabanas/{id} — Actualizar cabaña (solo admin)
    // ──────────────────────────────────────────────────────────
    public static HttpHandler actualizar = (HttpExchange exchange) -> {
        if (!"PUT".equals(exchange.getRequestMethod())) {
            JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false));
            return;
        }
        try {
            // Verificar admin
            String token = JsonUtil.extraerToken(exchange);
            String rol = JwtUtil.getRolFromToken(token);
            if (!"admin".equals(rol)) {
                JsonUtil.enviarRespuesta(exchange, 403, Map.of("success", false, "mensaje", "Acceso denegado."));
                return;
            }

            // Extraer ID de la URL
            String path = exchange.getRequestURI().getPath();
            String[] parts = path.split("/");
            int id = Integer.parseInt(parts[parts.length - 1]);

            JsonObject body = JsonUtil.leerBody(exchange);
            Cabana cabana = new Cabana();
            cabana.setId(id);
            cabana.setNombre(JsonUtil.getString(body, "nombre", ""));
            cabana.setDescripcion(JsonUtil.getString(body, "descripcion", ""));
            cabana.setTipo(JsonUtil.getString(body, "tipo", ""));
            cabana.setEstado(JsonUtil.getString(body, "estado", "Disponible"));
            cabana.setPrecio(JsonUtil.getDouble(body, "precio", 0));

            cabanaDAO.actualizar(cabana);
            JsonUtil.enviarRespuesta(exchange, 200, Map.of("success", true, "mensaje", "Cabaña actualizada."));
        } catch (Exception e) {
            System.err.println("Error actualizando cabaña: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false, "mensaje", "Error al actualizar."));
        }
    };
}
