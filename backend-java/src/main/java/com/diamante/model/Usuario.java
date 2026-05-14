package com.diamante.model;

/**
 * Modelo POJO — Representa un usuario del sistema (cliente o administrador).
 */
public class Usuario {
    private int id;
    private String nombre;
    private String correo;
    private String contrasena; // Hash BCrypt almacenado
    private int edad;
    private String documento;
    private String rol; // "cliente" o "admin"
    private String creadoEn;

    // Constructor vacío
    public Usuario() {}

    // Constructor completo
    public Usuario(int id, String nombre, String correo, String contrasena, int edad, String documento, String rol, String creadoEn) {
        this.id = id;
        this.nombre = nombre;
        this.correo = correo;
        this.contrasena = contrasena;
        this.edad = edad;
        this.documento = documento;
        this.rol = rol;
        this.creadoEn = creadoEn;
    }

    // Getters y Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getContrasena() { return contrasena; }
    public void setContrasena(String contrasena) { this.contrasena = contrasena; }

    public int getEdad() { return edad; }
    public void setEdad(int edad) { this.edad = edad; }

    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public String getCreadoEn() { return creadoEn; }
    public void setCreadoEn(String creadoEn) { this.creadoEn = creadoEn; }
}
