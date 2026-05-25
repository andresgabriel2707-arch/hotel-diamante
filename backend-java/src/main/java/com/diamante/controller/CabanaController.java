package com.diamante.controller;

import com.diamante.dao.CabanaDAO;
import com.diamante.model.Cabana;
import com.diamante.util.JsonUtil;
import com.diamante.util.JwtUtil;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Controlador HTTP para las rutas de cabañas (/api/cabanas/*).
 * Adapta la respuesta al formato que espera el frontend JS (campos _id, fotos, etc.)
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
            // Adaptar campos al formato que espera el frontend
            List<Map<String, Object>> resultado = cabanas.stream().map(c -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("_id", String.valueOf(c.getId()));
                m.put("id", c.getId());
                m.put("nombre", c.getNombre());
                m.put("descripcion", c.getDescripcion());
                m.put("tipo", c.getTipo());
                m.put("capacidad", c.getCapacidad());
                m.put("precio", "$" + String.format("%,.0f", c.getPrecio()) + "/noche");
                m.put("estado", c.getEstado());
                // El frontend espera un array 'fotos' con al menos 4 elementos
                m.put("fotos", List.of(
                    "images/cabana-" + c.getId() + "-1.jpg",
                    "images/cabana-" + c.getId() + "-2.jpg",
                    "images/cabana-" + c.getId() + "-3.jpg",
                    "images/cabana-" + c.getId() + "-4.jpg"
                ));
                return m;
            }).collect(Collectors.toList());
            JsonUtil.enviarRespuesta(exchange, 200, resultado);
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
            cabana.setCapacidad(JsonUtil.getInt(body, "capacidad", 2));

            cabanaDAO.actualizar(cabana);
            JsonUtil.enviarRespuesta(exchange, 200, Map.of("success", true, "mensaje", "Cabaña actualizada."));
        } catch (Exception e) {
            System.err.println("Error actualizando cabaña: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false, "mensaje", "Error al actualizar."));
        }
    };

    // ──────────────────────────────────────────────────────────
    //  POST /api/cabanas — Crear cabaña (solo admin)
    // ──────────────────────────────────────────────────────────
    public static HttpHandler crear = (HttpExchange exchange) -> {
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
            Cabana cabana = new Cabana();
            cabana.setNombre(JsonUtil.getString(body, "nombre", ""));
            cabana.setDescripcion(JsonUtil.getString(body, "descripcion", ""));
            cabana.setTipo(JsonUtil.getString(body, "tipo", ""));
            cabana.setEstado(JsonUtil.getString(body, "estado", "Disponible"));
            cabana.setPrecio(JsonUtil.getDouble(body, "precio", 0));
            cabana.setCapacidad(JsonUtil.getInt(body, "capacidad", 2));

            cabanaDAO.insertar(cabana);
            JsonUtil.enviarRespuesta(exchange, 201, Map.of("success", true, "mensaje", "Cabaña creada."));
        } catch (Exception e) {
            System.err.println("Error creando cabaña: " + e.getMessage());
            JsonUtil.enviarRespuesta(exchange, 500, Map.of("success", false, "mensaje", "Error al crear."));
        }
    };
}
