/**
 * Límite de envíos públicos por visitante (formularios, reservas, cotizaciones).
 * Ventana deslizante en memoria del proceso: suficiente para demos. Si una demo
 * pasa a producción, se cambia por un almacén compartido detrás de la misma interfaz.
 */
export interface LimitadorEnvios {
  permitir(clave: string): { ok: boolean; reintentarEnSeg?: number };
}

export function crearLimitador(maximo = Number(process.env.LIMITE_ENVIOS_POR_HORA ?? 5), ventanaMs = 3_600_000): LimitadorEnvios {
  const registros = new Map<string, number[]>();
  return {
    permitir(clave) {
      const ahora = Date.now();
      const recientes = (registros.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
      if (recientes.length >= maximo) {
        registros.set(clave, recientes);
        return { ok: false, reintentarEnSeg: Math.ceil((ventanaMs - (ahora - recientes[0]!)) / 1000) };
      }
      recientes.push(ahora);
      registros.set(clave, recientes);
      if (registros.size > 10_000) registros.delete(registros.keys().next().value!);
      return { ok: true };
    },
  };
}
