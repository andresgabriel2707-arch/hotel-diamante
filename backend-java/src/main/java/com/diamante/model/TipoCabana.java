package com.diamante.model;

/**
 * Modelo POJO — Representa un tipo de cabaña.
 * Incluye imágenes, precios base, capacidad y amenidades editables.
 */
public class TipoCabana {
    private int id;
    private String nombre;
    private String descripcion;
    private String imagenPrincipal;
    private String imagen2;
    private String imagen3;
    private double precioBase;
    private int capacidadMax;
    private String amenidades;
    private boolean activo;

    public TipoCabana() { this.activo = true; }

    public TipoCabana(int id, String nombre, String descripcion) {
        this.id = id; this.nombre = nombre; this.descripcion = descripcion;
        this.activo = true;
    }

    // Getters y Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getImagenPrincipal() { return imagenPrincipal; }
    public void setImagenPrincipal(String imagenPrincipal) { this.imagenPrincipal = imagenPrincipal; }
    public String getImagen2() { return imagen2; }
    public void setImagen2(String imagen2) { this.imagen2 = imagen2; }
    public String getImagen3() { return imagen3; }
    public void setImagen3(String imagen3) { this.imagen3 = imagen3; }
    public double getPrecioBase() { return precioBase; }
    public void setPrecioBase(double precioBase) { this.precioBase = precioBase; }
    public int getCapacidadMax() { return capacidadMax; }
    public void setCapacidadMax(int capacidadMax) { this.capacidadMax = capacidadMax; }
    public String getAmenidades() { return amenidades; }
    public void setAmenidades(String amenidades) { this.amenidades = amenidades; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
}
