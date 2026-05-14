package com.diamante.dao;

import com.diamante.config.DatabaseConnection;
import com.diamante.model.Cabana;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object para la tabla 'cabanas'.
 * Conectada a 'tipo_cabana' mediante JOIN.
 */
public class CabanaDAO {

    // ══════════════════════════════════════════════════════════
    //  CREATE — Inserción de una nueva cabaña
    // ══════════════════════════════════════════════════════════
    public boolean insertar(Cabana cabana) throws SQLException {
        // Buscar tipo_id por nombre del tipo
        int tipoId = obtenerTipoId(cabana.getTipo());
        String sql = "INSERT INTO cabanas (nombre, tipo_id, estado, precio, capacidad, descripcion) VALUES (?, ?, ?, ?, ?, ?)";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, cabana.getNombre());
        ps.setInt(2, tipoId);
        ps.setString(3, cabana.getEstado() != null ? cabana.getEstado() : "Disponible");
        ps.setDouble(4, cabana.getPrecio());
        ps.setInt(5, cabana.getCapacidad());
        ps.setString(6, cabana.getDescripcion());
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  READ — Consulta de todas las cabañas (JOIN con tipo_cabana)
    // ══════════════════════════════════════════════════════════
    public List<Cabana> listarTodas() throws SQLException {
        String sql = "SELECT c.*, tc.nombre AS tipo_nombre FROM cabanas c " +
                     "JOIN tipo_cabana tc ON c.tipo_id = tc.id ORDER BY c.nombre ASC";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ResultSet rs = ps.executeQuery();
        List<Cabana> lista = new ArrayList<>();
        while (rs.next()) {
            lista.add(mapearResultSet(rs));
        }
        rs.close();
        ps.close();
        return lista;
    }

    // ══════════════════════════════════════════════════════════
    //  READ — Consulta de cabaña por ID
    // ══════════════════════════════════════════════════════════
    public Cabana buscarPorId(int id) throws SQLException {
        String sql = "SELECT c.*, tc.nombre AS tipo_nombre FROM cabanas c " +
                     "JOIN tipo_cabana tc ON c.tipo_id = tc.id WHERE c.id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, id);
        ResultSet rs = ps.executeQuery();
        Cabana cabana = null;
        if (rs.next()) {
            cabana = mapearResultSet(rs);
        }
        rs.close();
        ps.close();
        return cabana;
    }

    // ══════════════════════════════════════════════════════════
    //  UPDATE — Actualización de datos de la cabaña
    // ══════════════════════════════════════════════════════════
    public boolean actualizar(Cabana cabana) throws SQLException {
        int tipoId = obtenerTipoId(cabana.getTipo());
        String sql = "UPDATE cabanas SET nombre = ?, tipo_id = ?, estado = ?, precio = ?, capacidad = ?, descripcion = ? WHERE id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, cabana.getNombre());
        ps.setInt(2, tipoId);
        ps.setString(3, cabana.getEstado());
        ps.setDouble(4, cabana.getPrecio());
        ps.setInt(5, cabana.getCapacidad());
        ps.setString(6, cabana.getDescripcion());
        ps.setInt(7, cabana.getId());
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  DELETE — Eliminación de cabaña por ID
    // ══════════════════════════════════════════════════════════
    public boolean eliminar(int id) throws SQLException {
        String sql = "DELETE FROM cabanas WHERE id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, id);
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  Helper — Obtener tipo_id por nombre
    // ══════════════════════════════════════════════════════════
    private int obtenerTipoId(String tipoNombre) throws SQLException {
        String sql = "SELECT id FROM tipo_cabana WHERE nombre = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, tipoNombre);
        ResultSet rs = ps.executeQuery();
        int tipoId = 1; // default
        if (rs.next()) tipoId = rs.getInt("id");
        rs.close();
        ps.close();
        return tipoId;
    }

    // ══════════════════════════════════════════════════════════
    //  Helper — Mapea un ResultSet a un objeto Cabana
    // ══════════════════════════════════════════════════════════
    private Cabana mapearResultSet(ResultSet rs) throws SQLException {
        Cabana c = new Cabana();
        c.setId(rs.getInt("id"));
        c.setNombre(rs.getString("nombre"));
        c.setTipo(rs.getString("tipo_nombre")); // Viene del JOIN con tipo_cabana
        c.setEstado(rs.getString("estado"));
        c.setPrecio(rs.getDouble("precio"));
        c.setCapacidad(rs.getInt("capacidad"));
        c.setDescripcion(rs.getString("descripcion"));
        return c;
    }
}
