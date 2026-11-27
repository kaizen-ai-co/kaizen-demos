import { etapasDe, responsablesDe } from '@/lib/crm';
import { plantilla } from '@/lib/plantilla';
import { protegerPanel } from '@/lib/proteger';
import { Tablero } from './Tablero';

export default async function PaginaTablero() {
  await protegerPanel();
  const { datos } = await plantilla.obtenerContenido();
  const leads = await (await plantilla.capa()).leads.listar(plantilla.sitioId());
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl">Tablero por etapas</h1>
        <p className="text-sm text-suave">Arrastra una tarjeta a otra columna (o usa el selector de la tarjeta). Cada cambio queda en el historial del lead.</p>
      </div>
      <Tablero
        etapas={etapasDe(datos).map((e) => ({ id: e.id, nombre: e.nombre, color: e.color }))}
        responsables={Object.fromEntries(responsablesDe(datos).map((r) => [r.id, r.nombre]))}
        leadsIniciales={leads.map((l) => ({ id: l.id, nombre: l.nombre, etapa: l.etapa, responsableId: l.responsableId, origen: l.origen }))}
      />
    </div>
  );
}
