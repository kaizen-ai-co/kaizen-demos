# Agentes de Kaizen demos

Catorce agentes en `.claude/agents/`, cada uno basado en un agente popular de la comunidad
(colecciones tipo _awesome-claude-code-subagents_ y _wshobson/agents_) y adaptado a este repo.
Para editarlos: abre el `.md`, cambia el frontmatter (`description` decide cuándo se invoca,
`tools` limita lo que puede hacer, `model` el costo) o el cuerpo (instrucciones).

## Mapa

```
                        ┌──────────────────────┐
                        │  orquestador-demos   │  (opus · delega y revisa)
                        └──────────┬───────────┘
   ┌───────────────┬───────────────┼────────────────┬────────────────┐
   ▼               ▼               ▼                ▼                ▼
arquitecto-     ingeniero-      redactor-       desarrollador-    ingeniero-
nextjs          editor          demos           frontend          datos
(base, apps)    (esquemas,      (contenido,     (bloques,         (capa de datos,
                controles)      semillas)       páginas)          reglas, roles)
                                   │                │
                               disenador-ui    especialista-3d
                               (tema, variantes)  (plantilla 4)
                                        │
                     ┌──────────────────┼──────────────────┐
                     ▼                  ▼                  ▼
              ingeniero-pruebas   auditor-seguridad   auditor-calidad
              (Vitest, Playwright) (solo lectura)     (Lighthouse, a11y, licencias)
                     └──────────┬───────┴──────────────────┘
                                ▼
                         revisor-codigo  →  ingeniero-despliegue  →  cronista-slack
```

| Agente                 | Basado en                                  | Modelo | Escribe código  | Cuándo                                      |
| ---------------------- | ------------------------------------------ | ------ | --------------- | ------------------------------------------- |
| orquestador-demos      | project-manager, tech-lead                 | opus   | integración     | Siempre primero en pedidos de varias partes |
| arquitecto-nextjs      | nextjs-developer, architect-reviewer       | sonnet | sí              | App nueva, config, paquetes                 |
| ingeniero-datos        | backend-developer, database-architect      | sonnet | sí              | Capa de datos, reglas, roles, proveedores   |
| ingeniero-editor       | react-specialist, api-designer             | sonnet | sí              | Esquemas y controles del editor             |
| desarrollador-frontend | frontend-developer                         | sonnet | sí              | Bloques y páginas                           |
| disenador-ui           | ui-ux-designer                             | sonnet | tokens/semillas | Tema, variantes, marca del cliente          |
| especialista-3d        | threejs/webgl developer                    | sonnet | sí              | Plantilla 4                                 |
| redactor-demos         | content-marketer, copywriter               | sonnet | semillas        | Contenido en palabras del cliente           |
| ingeniero-pruebas      | test-automator, qa-expert                  | sonnet | pruebas         | Lógica y recorridos                         |
| auditor-seguridad      | security-auditor                           | opus   | no              | Antes de entregar o tocar acceso            |
| auditor-calidad        | performance-engineer, accessibility-tester | sonnet | no              | Antes de entregar                           |
| revisor-codigo         | code-reviewer                              | opus   | no              | Antes del PR                                |
| ingeniero-despliegue   | deployment-engineer                        | sonnet | sí              | Docker, CI, Vercel, Cloudflare              |
| cronista-slack         | technical-writer                           | haiku  | no              | Cierre de cada entrega                      |

## Contrato de entrega (lo devuelve TODO agente)

Así el orquestador encadena agentes sin perder información y el cronista arma el mensaje de Slack.

```markdown
## Entrega · <agente> · <tarea>

- **Estado:** listo | parcial | bloqueado
- **Archivos:** <rutas creadas o tocadas>
- **Evidencia:** <comando> → <resultado> (p. ej. `npm test` → 41/41; build OK; capturas en capturas/…)
- **Decisiones:** <qué decidiste y por qué, en una línea cada una>
- **Estado honesto:** disponible <…> · prototipo <…> · pendiente <…>
- **Siguiente:** <agente> — <qué necesita de esta entrega>
- **Bloqueos:** <qué falta y de quién> | Ninguno
```

## Encargo (lo que el orquestador envía)

```
Objetivo · Plantilla/app · Sitio · Sector · Lee · No toques · Hecho cuando · Devuelve
```

## Agregar un agente nuevo

1. Copia el más parecido en `.claude/agents/` y cambia `name` y `description` (la descripción debe decir
   CUÁNDO usarlo, con verbos y ejemplos de pedido).
2. Limita `tools` a lo mínimo (los auditores no escriben).
3. Sección «Lee primero» con rutas exactas, «Hecho cuando» comprobable y «Devuelve» el contrato.
4. Agrégalo a la tabla de arriba y a la cadena del orquestador.
