// Error "controlado" de la API: lleva el estado HTTP, un código corto y un mensaje claro.
// Los controladores lanzan ApiError y el middleware errorHandler lo convierte en JSON.
class ApiError extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }

  static badRequest(mensaje, detalles) { return new ApiError(400, 'SOLICITUD_INVALIDA', mensaje, detalles); }
  static validacion(detalles) { return new ApiError(422, 'VALIDACION', 'Los datos enviados no son válidos', detalles); }
  static noAutenticado(mensaje = 'Se requiere autenticación', codigo = 'NO_AUTENTICADO') { return new ApiError(401, codigo, mensaje); }
  static prohibido(mensaje = 'No tienes permiso para realizar esta acción') { return new ApiError(403, 'PROHIBIDO', mensaje); }
  static noEncontrado(mensaje = 'Recurso no encontrado') { return new ApiError(404, 'NO_ENCONTRADO', mensaje); }
  static conflicto(mensaje) { return new ApiError(409, 'CONFLICTO', mensaje); }
}

module.exports = ApiError;
