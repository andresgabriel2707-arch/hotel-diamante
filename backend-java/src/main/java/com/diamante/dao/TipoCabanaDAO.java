package com.diamante.dao;

import com.diamante.config.DatabaseConnection;
import com.diamante.model.TipoCabana;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object para la tabla 'tipo_cabana'.
 * CRUD completo con soporte para imágenes, valores y descripciones editables.
 */
public class TipoCabanaDAO {

    // ══════════════════════════════════════════════════════════
    //  CREATE — Inserción de un nuevo tipo de cabaña
    // ══════════════════════════════════════════════════════════
    public boolean insertar(TipoCabana tipo) throws SQLException {
        String sql = "INSERT INTO tipo_cabana (nombre, descripcion, imagen_principal, imagen_2, imagen_3, precio_base, capacidad_max, amenidades, activo) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, tipo.getNombre());
        ps.setString(2, tipo.getDescripcion());
        ps.setString(3, tipo.getImagenPrincipal());
        ps.setString(4, tipo.getImagen2());
        ps.setString(5, tipo.getImagen3());
        ps.setDouble(6, tipo.getPrecioBase());
        ps.setInt(7, tipo.getCapacidadMax());
        ps.setString(8, tipo.getAmenidades());
        ps.setBoolean(9, tipo.isActivo());
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  READ — Listar todos los tipos de cabaña
    // ══════════════════════════════════════════════════════════
    public List<TipoCabana> listarTodos() throws SQLException {
        String sql = "SELECT * FROM tipo_cabana ORDER BY nombre ASC";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ResultSet rs = ps.executeQuery();
        List<TipoCabana> lista = new ArrayList<>();
        while (rs.next()) {
            lista.add(mapearResultSet(rs));
        }
        rs.close();
        ps.close();
        return lista;
    }

    // ══════════════════════════════════════════════════════════
    //  READ — Buscar tipo por ID
    // ══════════════════════════════════════════════════════════
    public TipoCabana buscarPorId(int id) throws SQLException {
        String sql = "SELECT * FROM tipo_cabana WHERE id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, id);
        ResultSet rs = ps.executeQuery();
        TipoCabana tipo = null;
        if (rs.next()) {
            tipo = mapearResultSet(rs);
        }
        rs.close();
        ps.close();
        return tipo;
    }

    // ══════════════════════════════════════════════════════════
    //  UPDATE — Actualizar TODOS los campos del tipo
    // ══════════════════════════════════════════════════════════
    public boolean actualizar(TipoCabana tipo) throws SQLException {
        String sql = "UPDATE tipo_cabana SET nombre = ?, descripcion = ?, imagen_principal = ?, imagen_2 = ?, imagen_3 = ?, " +
                     "precio_base = ?, capacidad_max = ?, amenidades = ?, activo = ? WHERE id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, tipo.getNombre());
        ps.setString(2, tipo.getDescripcion());
        ps.setString(3, tipo.getImagenPrincipal());
        ps.setString(4, tipo.getImagen2());
        ps.setString(5, tipo.getImagen3());
        ps.setDouble(6, tipo.getPrecioBase());
        ps.setInt(7, tipo.getCapacidadMax());
        ps.setString(8, tipo.getAmenidades());
        ps.setBoolean(9, tipo.isActivo());
        ps.setInt(10, tipo.getId());
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  UPDATE — Actualizar SOLO las imágenes
    // ══════════════════════════════════════════════════════════
    public boolean actualizarImagenes(int id, String imgPrincipal, String img2, String img3) throws SQLException {
        String sql = "UPDATE tipo_cabana SET imagen_principal = ?, imagen_2 = ?, imagen_3 = ? WHERE id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, imgPrincipal);
        ps.setString(2, img2);
        ps.setString(3, img3);
        ps.setInt(4, id);
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  UPDATE — Actualizar SOLO la descripción y amenidades
    // ══════════════════════════════════════════════════════════
    public boolean actualizarDescripcion(int id, String descripcion, String amenidades) throws SQLException {
        String sql = "UPDATE tipo_cabana SET descripcion = ?, amenidades = ? WHERE id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, descripcion);
        ps.setString(2, amenidades);
        ps.setInt(3, id);
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  UPDATE — Actualizar SOLO los valores numéricos
    // ══════════════════════════════════════════════════════════
    public boolean actualizarValores(int id, double precioBase, int capacidadMax) throws SQLException {
        String sql = "UPDATE tipo_cabana SET precio_base = ?, capacidad_max = ? WHERE id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setDouble(1, precioBase);
        ps.setInt(2, capacidadMax);
        ps.setInt(3, id);
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  DELETE — Eliminar tipo de cabaña por ID
    // ══════════════════════════════════════════════════════════
    public boolean eliminar(int id) throws SQLException {
        String sql = "DELETE FROM tipo_cabana WHERE id = ?";
        Connection conn = DatabaseConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, id);
        int filas = ps.executeUpdate();
        ps.close();
        return filas > 0;
    }

    // ══════════════════════════════════════════════════════════
    //  Helper — Mapea ResultSet a TipoCabana
    // ══════════════════════════════════════════════════════════
    private TipoCabana mapearResultSet(ResultSet rs) throws SQLException {
        TipoCabana t = new TipoCabana();
        t.setId(rs.getInt("id"));
        t.setNombre(rs.getString("nombre"));
        t.setDescripcion(rs.getString("descripcion"));
        t.setImagenPrincipal(rs.getString("imagen_principal"));
        t.setImagen2(rs.getString("imagen_2"));
        t.setImagen3(rs.getString("imagen_3"));
        t.setPrecioBase(rs.getDouble("precio_base"));
        t.setCapacidadMax(rs.getInt("capacidad_max"));
        t.setAmenidades(rs.getString("amenidades"));
        t.setActivo(rs.getBoolean("activo"));
        return t;
    }
}
