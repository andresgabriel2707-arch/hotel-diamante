package com.diamante.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Clase Singleton para gestionar la conexión JDBC a MySQL.
 * Centraliza la configuración de la base de datos.
 */
public class DatabaseConnection {

    private static final String URL = "jdbc:mysql://localhost:3306/hotel_management?useSSL=false&serverTimezone=America/Bogota&allowPublicKeyRetrieval=true";
    private static final String USER = "root";
    private static final String PASSWORD = ""; // XAMPP usa contraseña vacía por defecto

    private static Connection connection;

    // Constructor privado — patrón Singleton
    private DatabaseConnection() {}

    /**
     * Obtiene la conexión única a la base de datos.
     * Si no existe o está cerrada, crea una nueva.
     */
    public static Connection getConnection() throws SQLException {
        if (connection == null || connection.isClosed()) {
            try {
                // Cargar el driver JDBC de MySQL explícitamente
                Class.forName("com.mysql.cj.jdbc.Driver");
                connection = DriverManager.getConnection(URL, USER, PASSWORD);
                System.out.println("✅ Conexión JDBC a MySQL establecida.");
            } catch (ClassNotFoundException e) {
                throw new SQLException("Driver MySQL no encontrado. Verifique el classpath.", e);
            }
        }
        return connection;
    }

    /**
     * Cierra la conexión a la base de datos.
     */
    public static void closeConnection() {
        if (connection != null) {
            try {
                connection.close();
                System.out.println("🔌 Conexión JDBC cerrada.");
            } catch (SQLException e) {
                System.err.println("Error cerrando conexión: " + e.getMessage());
            }
        }
    }
}
