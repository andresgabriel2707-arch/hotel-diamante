package com.diamante.model;

/**
 * Modelo POJO — Representa una reserva de cabaña.
 */
public class Reserva {
    private int id;
    private String codigo;
    private int clienteId;
    private int cabanaId;
    private String huesped;       // Nombre del cliente (viene del JOIN)
    private String fechaLlegada;
    private String fechaSalida;
    private String estado;        // Nombre del estado (viene del JOIN con estado_reserva)
    private String pagoEstado;    // "Pendiente", "Pagado"
    private double total;
    private String metodoPago;
    private String creadoEn;
    private String cabanaNombre;  // Nombre de la cabaña (viene del JOIN)

    public Reserva() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public int getClienteId() { return clienteId; }
    public void setClienteId(int clienteId) { this.clienteId = clienteId; }
    public int getCabanaId() { return cabanaId; }
    public void setCabanaId(int cabanaId) { this.cabanaId = cabanaId; }
    public String getHuesped() { return huesped; }
    public void setHuesped(String huesped) { this.huesped = huesped; }
    public String getFechaLlegada() { return fechaLlegada; }
    public void setFechaLlegada(String fechaLlegada) { this.fechaLlegada = fechaLlegada; }
    public String getFechaSalida() { return fechaSalida; }
    public void setFechaSalida(String fechaSalida) { this.fechaSalida = fechaSalida; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getPagoEstado() { return pagoEstado; }
    public void setPagoEstado(String pagoEstado) { this.pagoEstado = pagoEstado; }
    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }
    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
    public String getCreadoEn() { return creadoEn; }
    public void setCreadoEn(String creadoEn) { this.creadoEn = creadoEn; }
    public String getCabanaNombre() { return cabanaNombre; }
    public void setCabanaNombre(String cabanaNombre) { this.cabanaNombre = cabanaNombre; }
}
