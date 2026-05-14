package com.diamante.dao;

import com.diamante.config.DatabaseConnection;
import com.diamante.model.Reserva;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object para la tabla 'reservas'.
 * Conectada a 'clientes', 'cabanas' y 'estado_reserva' mediante JOINs.
 */
public class ReservaDAO {

    // ══════════════════════════════════════════════════════════
    //  CREATE — Inserción de una nueva reserva
    // ══════════════════════════════════════════════════════════
    public boolean insertar(Reserva reserva) throws SQLException {
        int estadoId = obtenerEstadoId(reserva.getEstado() != null ? reserva.getEstado() : "Pendiente");
        String sql = "INSERT INTO reservas (codigo, cliente_id, cabana_id, estado_id, fecha_llegada, fecha_salida, pago_estado, total, metodo_pago) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, reserva.getCodigo());
        ps.setInt(2, reserva.getClienteId());
        ps.setInt(3, reserva.getCabanaId());
        ps.setInt(4, estadoId);
        ps.setString(5, reserva.getFechaLlegada());
        ps.setString(6, reserva.getFechaSalida());
        ps.setString(7, reserva.getPagoEstado() != null ? reserva.getPagoEstado() : "Pendiente");
        ps.setDouble(8, reserva.getTotal());
        ps.setString(9, reserva.getMetodoPago() != null ? reserva.getMetodoPago() : "Por definir");
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  READ — Consulta de todas las reservas (JOINs múltiples)
    // ══════════════════════════════════════════════════════════
    public List<Reserva> listarTodas() throws SQLException {
        String sql = "SELECT r.*, er.nombre AS estado_nombre, cab.nombre AS cabana_nombre, cl.nombre AS huesped_nombre " +
                     "FROM reservas r " +
                     "JOIN estado_reserva er ON r.estado_id = er.id " +
                     "JOIN cabanas cab ON r.cabana_id = cab.id " +
                     "JOIN clientes cl ON r.cliente_id = cl.id " +
                     "ORDER BY r.creado_en DESC";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ResultSet rs = ps.executeQuery();
        List<Reserva> lista = new ArrayList<>();
        while (rs.next()) {
            lista.add(mapearResultSet(rs));
        }
        rs.close();
        ps.close();
        return lista;
    }

    // ══════════════════════════════════════════════════════════
    //  READ — Consulta de reservas por cliente_id
    // ══════════════════════════════════════════════════════════
    public List<Reserva> listarPorCliente(int clienteId) throws SQLException {
        String sql = "SELECT r.*, er.nombre AS estado_nombre, cab.nombre AS cabana_nombre, cl.nombre AS huesped_nombre " +
                     "FROM reservas r " +
                     "JOIN estado_reserva er ON r.estado_id = er.id " +
                     "JOIN cabanas cab ON r.cabana_id = cab.id " +
                     "JOIN clientes cl ON r.cliente_id = cl.id " +
                     "WHERE r.cliente_id = ? ORDER BY r.creado_en DESC";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, clienteId);
        ResultSet rs = ps.executeQuery();
        List<Reserva> lista = new ArrayList<>();
        while (rs.next()) {
            lista.add(mapearResultSet(rs));
        }
        rs.close();
        ps.close();
        return lista;
    }

    // ══════════════════════════════════════════════════════════
    //  READ — Verificar disponibilidad (anti-overbooking)
    // ══════════════════════════════════════════════════════════
    public boolean estaDisponible(int cabanaId, String fechaLlegada, String fechaSalida) throws SQLException {
        // Excluir reservas canceladas del chequeo
        String sql = "SELECT COUNT(*) FROM reservas r " +
                     "JOIN estado_reserva er ON r.estado_id = er.id " +
                     "WHERE r.cabana_id = ? AND er.nombre != 'Cancelada' " +
                     "AND r.fecha_llegada < ? AND r.fecha_salida > ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, cabanaId);
        ps.setString(2, fechaSalida);
        ps.setString(3, fechaLlegada);
        ResultSet rs = ps.executeQuery();
        rs.next();
        int conflictos = rs.getInt(1);
        rs.close();
        ps.close();
        return conflictos == 0;
    }

    // ══════════════════════════════════════════════════════════
    //  UPDATE — Actualizar estado de la reserva
    // ══════════════════════════════════════════════════════════
    public boolean actualizarEstado(int id, String estadoNombre) throws SQLException {
        int estadoId = obtenerEstadoId(estadoNombre);
        String sql = "UPDATE reservas SET estado_id = ? WHERE id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, estadoId);
        ps.setInt(2, id);
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  UPDATE — Actualizar estado de pago
    // ══════════════════════════════════════════════════════════
    public boolean actualizarPagoEstado(int id, String pagoEstado) throws SQLException {
        String sql = "UPDATE reservas SET pago_estado = ? WHERE id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, pagoEstado);
        ps.setInt(2, id);
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  DELETE — Eliminación de reserva por ID
    // ══════════════════════════════════════════════════════════
    public boolean eliminar(int id) throws SQLException {
        String sql = "DELETE FROM reservas WHERE id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, id);
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  Helper — Obtener estado_id por nombre
    // ══════════════════════════════════════════════════════════
    private int obtenerEstadoId(String estadoNombre) throws SQLException {
        String sql = "SELECT id FROM estado_reserva WHERE nombre = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, estadoNombre);
        ResultSet rs = ps.executeQuery();
        int estadoId = 1; // default: Pendiente
        if (rs.next()) estadoId = rs.getInt("id");
        rs.close();
        ps.close();
        return estadoId;
    }

    // ══════════════════════════════════════════════════════════
    //  Helper — Mapea un ResultSet a un objeto Reserva
    // ══════════════════════════════════════════════════════════
    private Reserva mapearResultSet(ResultSet rs) throws SQLException {
        Reserva r = new Reserva();
        r.setId(rs.getInt("id"));
        r.setCodigo(rs.getString("codigo"));
        r.setClienteId(rs.getInt("cliente_id"));
        r.setCabanaId(rs.getInt("cabana_id"));
        r.setHuesped(rs.getString("huesped_nombre")); // Viene del JOIN con clientes
        r.setFechaLlegada(rs.getString("fecha_llegada"));
        r.setFechaSalida(rs.getString("fecha_salida"));
        r.setEstado(rs.getString("estado_nombre")); // Viene del JOIN con estado_reserva
        r.setPagoEstado(rs.getString("pago_estado"));
        r.setTotal(rs.getDouble("total"));
        r.setMetodoPago(rs.getString("metodo_pago"));
        r.setCreadoEn(rs.getString("creado_en"));
        r.setCabanaNombre(rs.getString("cabana_nombre")); // Viene del JOIN con cabanas
        return r;
    }
}
