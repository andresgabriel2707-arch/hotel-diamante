package com.diamante.model;

/**
 * Modelo POJO — Representa una cabaña del hotel.
 */
public class Cabana {
    private int id;
    private String nombre;
    private String tipo;      // Nombre del tipo (viene del JOIN con tipo_cabana)
    private String estado;    // "Disponible", "Ocupado", "Reservado"
    private double precio;
    private int capacidad;
    private String descripcion;

    public Cabana() {}

    public Cabana(int id, String nombre, String tipo, String estado, double precio, int capacidad, String descripcion) {
        this.id = id; this.nombre = nombre; this.tipo = tipo; this.estado = estado;
        this.precio = precio; this.capacidad = capacidad; this.descripcion = descripcion;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public double getPrecio() { return precio; }
    public void setPrecio(double precio) { this.precio = precio; }
    public int getCapacidad() { return capacidad; }
    public void setCapacidad(int capacidad) { this.capacidad = capacidad; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
}
