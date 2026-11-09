// Formato único para respuestas exitosas: { ok: true, data: ... }
// (los errores usan { ok: false, error: { codigo, mensaje, detalles } } en errorHandler)
const enviar = (res, status, data) => res.status(status).json({ ok: true, data });

module.exports = { enviar };
