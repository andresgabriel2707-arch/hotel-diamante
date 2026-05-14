package com.diamante.util;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

import java.util.Date;

/**
 * Utilidad para generar y verificar JSON Web Tokens (JWT).
 * Usa la misma clave secreta que el backend Node.js para compatibilidad.
 */
public class JwtUtil {

    private static final String SECRET = "diamante_secret_2026_safe";
    private static final Algorithm algorithm = Algorithm.HMAC256(SECRET);
    private static final long EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 horas

    /**
     * Genera un token JWT con los datos del usuario.
     */
    public static String generarToken(int id, String correo, String rol) {
        return JWT.create()
                .withClaim("id", id)
                .withClaim("correo", correo)
                .withClaim("rol", rol)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .sign(algorithm);
    }

    /**
     * Verifica y decodifica un token JWT.
     * Retorna el DecodedJWT si es válido, o null si es inválido/expirado.
     */
    public static DecodedJWT verificarToken(String token) {
        try {
            JWTVerifier verifier = JWT.require(algorithm).build();
            return verifier.verify(token);
        } catch (JWTVerificationException e) {
            return null; // Token inválido o expirado
        }
    }

    /**
     * Extrae el ID del usuario desde un token válido.
     */
    public static int getIdFromToken(String token) {
        DecodedJWT decoded = verificarToken(token);
        return decoded != null ? decoded.getClaim("id").asInt() : -1;
    }

    /**
     * Extrae el rol del usuario desde un token válido.
     */
    public static String getRolFromToken(String token) {
        DecodedJWT decoded = verificarToken(token);
        return decoded != null ? decoded.getClaim("rol").asString() : null;
    }
}
