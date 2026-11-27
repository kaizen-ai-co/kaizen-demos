# Despliegue

## Vercel (pruebas, vista previa por rama)

Un proyecto de Vercel por plantilla (lo crea Santiago con la cuenta oficial o te da acceso al equipo):

- Root Directory: `apps/<plantilla>` · Install: `npm install` (en la raíz, Vercel detecta workspaces) · Build: `npm run build`
- Variables: las de `.env.example` con `DATOS_PROVEEDOR=firebase`, `SITIO_ID=<sitio>`, `SECTOR` opcional.
- `SITIO_URL` (opcional, recomendada): URL pública de la demo, p. ej. `https://demos.<dominio>/clinica-x`.
  Hace que `og:image` sea absoluta para que la vista previa del enlace salga en WhatsApp, LinkedIn o correo.
  Sin ella Next usa la URL de la solicitud y algunas redes no muestran la imagen. Aplica igual en Docker o Cloudflare.
- Una demo de cliente = mismo proyecto con otra rama o un proyecto con su `SITIO_ID`.

## Docker (cualquier nube: Cloudflare, AWS, servidor propio)

```bash
docker build --build-arg APP=comercial -t kaizen/comercial .
docker run -p 3000:3000 --env-file .env.produccion kaizen/comercial
curl localhost:3000/api/salud
```

## Cloudflare

Para demos «más serias»: contenedor o Pages con DNS y **Cloudflare Access** delante de la sección de
administradores (`docs/demos.md`) para correos `@lkaizen.com`.

## Firebase

`npx firebase deploy --only firestore:rules,firestore:indexes,storage --project <id>` cada vez que cambien
`firestore.rules`, `storage.rules` o `firestore.indexes.json`.

## CI (GitHub Actions)

`.github/workflows/ci.yml`: instalar → validar esquemas, contraste y licencias → tipos → pruebas → build de las
seis apps → imagen Docker de ejemplo. `main` protegido: PR con CI en verde.
