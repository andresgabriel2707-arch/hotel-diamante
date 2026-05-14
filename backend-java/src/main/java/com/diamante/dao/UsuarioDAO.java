package com.diamante.dao;

import com.diamante.config.DatabaseConnection;
import com.diamante.model.Usuario;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object para la tabla 'usuarios'.
 * Ahora conectada a la tabla 'roles' y 'clientes' mediante JOINs.
 */
public class UsuarioDAO {

    // ══════════════════════════════════════════════════════════
    //  CREATE — Registro de usuario + cliente en una transacción
    // ══════════════════════════════════════════════════════════
    public int insertar(Usuario usuario) throws SQLException {
        Connection conn = DatabaseConnection.getConnection();
        // Buscar el rol_id correspondiente
        int rolId = obtenerRolId(usuario.getRol() != null ? usuario.getRol() : "cliente");

        String sql = "INSERT INTO usuarios (correo, contrasena, rol_id) VALUES (?, ?, ?)";
        PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
        ps.setString(1, usuario.getCorreo().toLowerCase());
        ps.setString(2, usuario.getContrasena());
        ps.setInt(3, rolId);
        ps.executeUpdate();

        // Obtener el ID generado
        ResultSet keys = ps.getGeneratedKeys();
        int userId = -1;
        if (keys.next()) {
            userId = keys.getInt(1);
        }
        keys.close();
        ps.close();

        // Insertar datos del cliente si no es admin
        if (!"admin".equals(usuario.getRol()) || (usuario.getNombre() != null && !usuario.getNombre().isEmpty())) {
            String sqlCliente = "INSERT INTO clientes (usuario_id, nombre, edad, documento) VALUES (?, ?, ?, ?)";
            PreparedStatement psC = conn.prepareStatement(sqlCliente);
            psC.setInt(1, userId);
            psC.setString(2, usuario.getNombre() != null ? usuario.getNombre() : "Usuario");
            psC.setInt(3, usuario.getEdad());
            psC.setString(4, usuario.getDocumento() != null ? usuario.getDocumento() : "");
            psC.executeUpdate();
            psC.close();
        }

        return userId;
    }

    // ══════════════════════════════════════════════════════════
    //  READ — Consulta por correo electrónico (JOIN con roles)
    // ══════════════════════════════════════════════════════════
    public Usuario buscarPorCorreo(String correo) throws SQLException {
        String sql = "SELECT u.*, r.nombre AS rol_nombre, c.nombre AS cliente_nombre, c.edad, c.documento, c.id AS cliente_id " +
                     "FROM usuarios u " +
                     "JOIN roles r ON u.rol_id = r.id " +
                     "LEFT JOIN clientes c ON c.usuario_id = u.id " +
                     "WHERE u.correo = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, correo.toLowerCase());
        ResultSet rs = ps.executeQuery();
        Usuario usuario = null;
        if (rs.next()) {
            usuario = mapearResultSet(rs);
        }
        rs.close();
        ps.close();
        return usuario;
    }

    // ══════════════════════════════════════════════════════════
    //  READ — Consulta por ID (JOIN con roles y clientes)
    // ══════════════════════════════════════════════════════════
    public Usuario buscarPorId(int id) throws SQLException {
        String sql = "SELECT u.*, r.nombre AS rol_nombre, c.nombre AS cliente_nombre, c.edad, c.documento, c.id AS cliente_id " +
                     "FROM usuarios u " +
                     "JOIN roles r ON u.rol_id = r.id " +
                     "LEFT JOIN clientes c ON c.usuario_id = u.id " +
                     "WHERE u.id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, id);
        ResultSet rs = ps.executeQuery();
        Usuario usuario = null;
        if (rs.next()) {
            usuario = mapearResultSet(rs);
        }
        rs.close();
        ps.close();
        return usuario;
    }

    // ══════════════════════════════════════════════════════════
    //  READ — Listar todos los clientes (JOIN usuarios + clientes)
    // ══════════════════════════════════════════════════════════
    public List<Usuario> listarClientes() throws SQLException {
        String sql = "SELECT u.id, u.correo, u.creado_en, r.nombre AS rol_nombre, " +
                     "c.nombre AS cliente_nombre, c.edad, c.documento, c.id AS cliente_id " +
                     "FROM usuarios u " +
                     "JOIN roles r ON u.rol_id = r.id " +
                     "LEFT JOIN clientes c ON c.usuario_id = u.id " +
                     "WHERE r.nombre = 'cliente' ORDER BY u.creado_en DESC";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ResultSet rs = ps.executeQuery();
        List<Usuario> lista = new ArrayList<>();
        while (rs.next()) {
            lista.add(mapearResultSet(rs));
        }
        rs.close();
        ps.close();
        return lista;
    }

    // ══════════════════════════════════════════════════════════
    //  READ — Listar todos los administradores
    // ══════════════════════════════════════════════════════════
    public List<Usuario> listarAdmins() throws SQLException {
        String sql = "SELECT u.id, u.correo, u.creado_en, r.nombre AS rol_nombre, " +
                     "c.nombre AS cliente_nombre, c.edad, c.documento, c.id AS cliente_id " +
                     "FROM usuarios u " +
                     "JOIN roles r ON u.rol_id = r.id " +
                     "LEFT JOIN clientes c ON c.usuario_id = u.id " +
                     "WHERE r.nombre = 'admin' ORDER BY u.creado_en DESC";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ResultSet rs = ps.executeQuery();
        List<Usuario> lista = new ArrayList<>();
        while (rs.next()) {
            lista.add(mapearResultSet(rs));
        }
        rs.close();
        ps.close();
        return lista;
    }

    // ══════════════════════════════════════════════════════════
    //  UPDATE — Actualizar datos del cliente
    // ══════════════════════════════════════════════════════════
    public boolean actualizar(Usuario usuario) throws SQLException {
        String sql = "UPDATE clientes SET nombre = ?, edad = ?, documento = ? WHERE usuario_id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, usuario.getNombre());
        ps.setInt(2, usuario.getEdad());
        ps.setString(3, usuario.getDocumento());
        ps.setInt(4, usuario.getId());
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  DELETE — Eliminar usuario (CASCADE borra el cliente también)
    // ══════════════════════════════════════════════════════════
    public boolean eliminar(int id) throws SQLException {
        String sql = "DELETE FROM usuarios WHERE id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, id);
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  Helper — Obtener cliente_id a partir de usuario_id
    // ══════════════════════════════════════════════════════════
    public int obtenerClienteId(int usuarioId) throws SQLException {
        String sql = "SELECT id FROM clientes WHERE usuario_id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, usuarioId);
        ResultSet rs = ps.executeQuery();
        int clienteId = -1;
        if (rs.next()) clienteId = rs.getInt("id");
        rs.close();
        ps.close();
        return clienteId;
    }

    // ══════════════════════════════════════════════════════════
    //  Helper — Obtener rol_id por nombre
    // ══════════════════════════════════════════════════════════
    private int obtenerRolId(String rolNombre) throws SQLException {
        String sql = "SELECT id FROM roles WHERE nombre = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, rolNombre);
        ResultSet rs = ps.executeQuery();
        int rolId = 2; // default: cliente
        if (rs.next()) rolId = rs.getInt("id");
        rs.close();
        ps.close();
        return rolId;
    }

    // ══════════════════════════════════════════════════════════
    //  Helper — Mapea ResultSet a Usuario (con datos de cliente y rol)
    // ══════════════════════════════════════════════════════════
    private Usuario mapearResultSet(ResultSet rs) throws SQLException {
        Usuario u = new Usuario();
        u.setId(rs.getInt("id"));
        u.setCorreo(rs.getString("correo"));
        try { u.setContrasena(rs.getString("contrasena")); } catch (SQLException ignored) {}
        u.setRol(rs.getString("rol_nombre"));
        u.setNombre(rs.getString("cliente_nombre") != null ? rs.getString("cliente_nombre") : "Admin");
        try { u.setEdad(rs.getInt("edad")); } catch (SQLException ignored) {}
        try { u.setDocumento(rs.getString("documento")); } catch (SQLException ignored) {}
        u.setCreadoEn(rs.getString("creado_en"));
        return u;
    }
}
