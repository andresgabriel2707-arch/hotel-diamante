package com.diamante.util;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Utilidades para manejar JSON en las peticiones y respuestas HTTP.
 */
public class JsonUtil {

    private static final Gson gson = new Gson();

    /**
     * Lee el cuerpo de una petición HTTP como JsonObject.
     */
    public static JsonObject leerBody(HttpExchange exchange) throws IOException {
        InputStreamReader reader = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
        JsonObject body = JsonParser.parseReader(reader).getAsJsonObject();
        reader.close();
        return body;
    }

    /**
     * Envía una respuesta JSON al cliente.
     */
    public static void enviarRespuesta(HttpExchange exchange, int statusCode, Object data) throws IOException {
        String json = gson.toJson(data);
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    /**
     * Extrae el token Bearer del header Authorization.
     */
    public static String extraerToken(HttpExchange exchange) {
        String auth = exchange.getRequestHeaders().getFirst("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return auth.substring(7);
        }
        return null;
    }

    /**
     * Helper: obtener un String seguro de un JsonObject.
     */
    public static String getString(JsonObject obj, String key, String defaultValue) {
        return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsString() : defaultValue;
    }

    /**
     * Helper: obtener un int seguro de un JsonObject.
     */
    public static int getInt(JsonObject obj, String key, int defaultValue) {
        return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsInt() : defaultValue;
    }

    /**
     * Helper: obtener un double seguro de un JsonObject.
     */
    public static double getDouble(JsonObject obj, String key, double defaultValue) {
        return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsDouble() : defaultValue;
    }

    /**
     * Convierte un objeto Java a su representación JSON.
     */
    public static String toJson(Object obj) {
        return gson.toJson(obj);
    }
}
