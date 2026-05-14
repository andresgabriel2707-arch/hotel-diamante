package com.diamante;

import com.diamante.config.DatabaseConnection;
import com.diamante.controller.AuthController;
import com.diamante.controller.CabanaController;
import com.diamante.controller.ReservaController;
import com.diamante.dao.CabanaDAO;
import com.diamante.dao.UsuarioDAO;
import com.diamante.model.Cabana;
import com.diamante.model.Usuario;
import com.diamante.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.mindrot.jbcrypt.BCrypt;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.*;
import java.sql.Connection;
import java.util.Map;

/**
 * Punto de entrada principal del backend Hotel Diamante.
 * Levanta un servidor HTTP en el puerto 3000 con las rutas REST
 * y sirve los archivos estáticos del frontend.
 */
public class Main {

    private static final int PORT = 3000;

    public static void main(String[] args) throws Exception {
        System.out.println("╔══════════════════════════════════════════╗");
        System.out.println("║   Hotel Diamante — Backend Java/JDBC    ║");
        System.out.println("╚══════════════════════════════════════════╝");

        // 1. Conectar a MySQL
        Connection conn = DatabaseConnection.getConnection();

        // 2. Seed: datos iniciales
        seedData();

        // 3. Crear servidor HTTP
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // ── Rutas API de Autenticación ──
        server.createContext("/api/auth/register", withCors(AuthController.register));
        server.createContext("/api/auth/login", withCors(AuthController.login));
        server.createContext("/api/auth/users", withCors((exchange) -> {
            String method = exchange.getRequestMethod();
            if ("GET".equals(method)) {
                AuthController.getUsers.handle(exchange);
            } else if ("DELETE".equals(method)) {
                AuthController.deleteUser.handle(exchange);
            } else if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
            } else {
                JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false));
            }
        }));
        server.createContext("/api/auth/admins", withCors((exchange) -> {
            String method = exchange.getRequestMethod();
            if ("GET".equals(method)) {
                AuthController.getAdmins.handle(exchange);
            } else if ("DELETE".equals(method)) {
                AuthController.deleteUser.handle(exchange);
            } else if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
            } else {
                JsonUtil.enviarRespuesta(exchange, 405, Map.of("success", false));
            }
        }));
        server.createContext("/api/auth/add-admin", withCors(AuthController.addAdmin));

        // ── Rutas API de Cabañas ──
        server.createContext("/api/cabanas", withCors((exchange) -> {
            String path = exchange.getRequestURI().getPath();
            String method = exchange.getRequestMethod();

            if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            // /api/cabanas → listar, /api/cabanas/123 → actualizar
            if ("/api/cabanas".equals(path) && "GET".equals(method)) {
                CabanaController.listar.handle(exchange);
            } else if (path.matches("/api/cabanas/\\d+") && "PUT".equals(method)) {
                CabanaController.actualizar.handle(exchange);
            } else {
                JsonUtil.enviarRespuesta(exchange, 404, Map.of("success", false));
            }
        }));

        // ── Rutas API de Reservas ──
        server.createContext("/api/reservas", withCors((exchange) -> {
            String path = exchange.getRequestURI().getPath();
            String method = exchange.getRequestMethod();

            if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            // Rutas específicas primero
            if ("/api/reservas/check".equals(path) && "POST".equals(method)) {
                ReservaController.check.handle(exchange);
            } else if ("/api/reservas/mis-reservas".equals(path) && "GET".equals(method)) {
                ReservaController.misReservas.handle(exchange);
            } else if (path.matches("/api/reservas/\\d+/estado") && "PATCH".equals(method)) {
                ReservaController.actualizarEstado.handle(exchange);
            } else if (path.matches("/api/reservas/\\d+/pago") && "PATCH".equals(method)) {
                ReservaController.actualizarPago.handle(exchange);
            } else if ("/api/reservas".equals(path) && "GET".equals(method)) {
                ReservaController.listar.handle(exchange);
            } else if ("/api/reservas".equals(path) && "POST".equals(method)) {
                ReservaController.crear.handle(exchange);
            } else {
                JsonUtil.enviarRespuesta(exchange, 404, Map.of("success", false));
            }
        }));

        // ── Ruta de salud ──
        server.createContext("/api/health", withCors((exchange) -> {
            JsonUtil.enviarRespuesta(exchange, 200, Map.of(
                "status", "ok",
                "message", "Servidor Hotel Diamante (Java/JDBC) corriendo correctamente."
            ));
        }));

        // ── Servir archivos estáticos del frontend ──
        // El frontend está un directorio arriba: ../index.html, ../cabanas.html, etc.
        server.createContext("/", (exchange) -> {
            String requestPath = exchange.getRequestURI().getPath();
            if (requestPath.equals("/")) requestPath = "/index.html";

            // Ruta relativa al frontend (directorio padre del backend)
            Path frontendDir = Paths.get(System.getProperty("user.dir")).getParent();
            Path filePath = frontendDir.resolve(requestPath.substring(1)).normalize();

            // Seguridad: no salir del directorio frontend
            if (!filePath.startsWith(frontendDir)) {
                exchange.sendResponseHeaders(403, -1);
                return;
            }

            File file = filePath.toFile();
            if (file.exists() && file.isFile()) {
                // Determinar Content-Type
                String ct = getContentType(file.getName());
                exchange.getResponseHeaders().set("Content-Type", ct);
                exchange.sendResponseHeaders(200, file.length());
                OutputStream os = exchange.getResponseBody();
                Files.copy(filePath, os);
                os.close();
            } else {
                String resp = "404 Not Found";
                exchange.sendResponseHeaders(404, resp.length());
                exchange.getResponseBody().write(resp.getBytes());
                exchange.getResponseBody().close();
            }
        });

        server.setExecutor(null); // Default executor
        server.start();

        System.out.println("✅ Servidor Hotel Diamante escuchando en http://localhost:" + PORT);
        System.out.println("📂 Frontend servido desde: " + Paths.get(System.getProperty("user.dir")).getParent());
        System.out.println("🔌 Base de datos: MySQL via JDBC");
        System.out.println("──────────────────────────────────────────");
    }

    /**
     * Seed: insertar datos iniciales si las tablas están vacías.
     */
    private static void seedData() {
        try {
            UsuarioDAO usuarioDAO = new UsuarioDAO();
            CabanaDAO cabanaDAO = new CabanaDAO();

            // Admin por defecto
            if (usuarioDAO.buscarPorCorreo("admin@diamante.com") == null) {
                Usuario admin = new Usuario();
                admin.setNombre("Administrador");
                admin.setCorreo("admin@diamante.com");
                admin.setContrasena(BCrypt.hashpw("Admin123", BCrypt.gensalt(10)));
                admin.setEdad(0);
                admin.setDocumento("ADMIN");
                admin.setRol("admin");
                usuarioDAO.insertar(admin);
                System.out.println("👤 Admin por defecto creado: admin@diamante.com / Admin123");
            }

            // Cabañas por defecto (el SQL ya inserta los datos, esto es solo un fallback)
            if (cabanaDAO.listarTodas().isEmpty()) {
                Cabana c1 = new Cabana(0, "Diamante 1", "Romántica", "Disponible", 350000, 2, "Cabaña romántica con vista al río.");
                Cabana c2 = new Cabana(0, "Diamante 2", "Familiar", "Disponible", 550000, 6, "Cabaña familiar con amplia terraza.");
                Cabana c3 = new Cabana(0, "Diamante 3", "Lujo", "Disponible", 750000, 4, "Cabaña de lujo con jacuzzi.");
                cabanaDAO.insertar(c1);
                cabanaDAO.insertar(c2);
                cabanaDAO.insertar(c3);
                System.out.println("🏡 Cabañas de ejemplo insertadas.");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Error en seed: " + e.getMessage());
        }
    }

    /**
     * Wrapper CORS: agrega headers de Cross-Origin a todas las respuestas.
     */
    private static HttpHandler withCors(HttpHandler handler) {
        return (HttpExchange exchange) -> {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");

            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            handler.handle(exchange);
        };
    }

    /**
     * Determina el Content-Type según la extensión del archivo.
     */
    private static String getContentType(String fileName) {
        if (fileName.endsWith(".html")) return "text/html; charset=UTF-8";
        if (fileName.endsWith(".css"))  return "text/css; charset=UTF-8";
        if (fileName.endsWith(".js"))   return "application/javascript; charset=UTF-8";
        if (fileName.endsWith(".json")) return "application/json; charset=UTF-8";
        if (fileName.endsWith(".png"))  return "image/png";
        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
        if (fileName.endsWith(".gif"))  return "image/gif";
        if (fileName.endsWith(".svg"))  return "image/svg+xml";
        if (fileName.endsWith(".ico"))  return "image/x-icon";
        return "application/octet-stream";
    }
}
