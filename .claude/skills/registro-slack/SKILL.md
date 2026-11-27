---
name: registro-slack
description: Redacta (y, con confirmación, publica) el registro de avance en el hilo de Slack del cliente o la tarea: qué terminó, dónde está la evidencia, qué sigue y qué bloquea. Úsala al cerrar una entrega, al quedar bloqueado o al final del día.
argument-hint: <hilo o cliente> [resumen]
---

# Registro en Slack

Destino: **$ARGUMENTS**

1. Reúne la evidencia: contratos de entrega de los agentes, `git log --oneline -15`, resultado de
   `npm run validar`, URLs de vista previa (sin credenciales).
2. Redacta con el formato del agente `cronista-slack` (terminado · evidencia · sigue · bloquea · estado de la demo).
3. Busca el hilo correcto (cliente en #operacion-clientes; plantillas en #todo-kaizen; desarrollo en #desarrollo).
   Responde EN el hilo, no en el canal.
4. **Muestra el texto y pide confirmación antes de publicar.** Sin conexión a Slack: entrégalo en un bloque para pegar.
5. Nunca incluyas enlaces a Linear, notas de dirección, conversaciones privadas, credenciales ni datos personales.
6. Decisiones que son de Santiago (precio, alcance, fecha, dominio): escríbelas como pregunta en «Bloquea».
