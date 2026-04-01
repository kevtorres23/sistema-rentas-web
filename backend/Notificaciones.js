import plantillas from "./Plantillas.js";

const parseFecha = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;

  const texto = String(valor);
  const partes = texto.split("-");

  if (partes.length === 3) {
    if (partes[0].length === 4) {
      const [anio, mes, dia] = partes.map(Number);
      return new Date(anio, mes - 1, dia);
    }

    const [mes, dia, anio] = partes.map(Number);
    return new Date(anio, mes - 1, dia);
  }

  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

export const generarNotificaciones = (pagos, diasAviso = 10) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const resultados = [];

  for (const pago of pagos) {
    const fechaVen = parseFecha(pago.vencimiento);
    if (!fechaVen) continue;

    const diasRes = Math.floor(
      (fechaVen - hoy) / (1000 * 60 * 60 * 24)
    );

    let estado;
    let mensaje = "";
    const nombre = pago.nombre || pago.arrendatario || "Arrendatario";
    const apartamento = pago.apartamento || pago.Apartamento || "";

    if (diasRes < 0) {
      estado = "Vencido";
      mensaje = plantillas.vencido({
        nombre,
        monto: pago.monto,
        fecha: pago.vencimiento,
      });
    } else if (diasRes === 0) {
      estado = "Hoy";
      mensaje = plantillas.hoy({ nombre, monto: pago.monto });
    } else if (diasRes <= diasAviso) {
      estado = "Aviso";
      mensaje = plantillas.aviso({
        nombre,
        monto: pago.monto,
        fecha: pago.vencimiento,
        dias: diasRes,
      });
    } else {
      continue;
    }

    resultados.push({
      apartamento,
      monto: pago.monto,
      estado,
      dias_restantes: diasRes,
      vencimiento: pago.vencimiento,
      nombre,
      mensaje,
      tenant_id: pago.tenant_id ?? null,
      apartment_id: pago.apartment_id ?? null,
    });
  }

  return resultados;
};

export default generarNotificaciones;
