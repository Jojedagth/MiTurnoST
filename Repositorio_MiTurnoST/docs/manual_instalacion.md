# Manual de instalación y despliegue · MiTurno ST (prototipo v2)

## 1. Requisitos

| Para | Necesitas |
|---|---|
| Usar el prototipo | Un navegador actual (Chrome, Edge, Firefox o Safari). No requiere internet. |
| Publicarlo en la web | Una cuenta de GitHub (GitHub Pages) o cualquier hosting de archivos estáticos. |
| Ejecutar las pruebas | Node.js 18 o superior y Google Chrome o Chromium. |

## 2. Abrir el prototipo en un computador

1. Descarga el repositorio: botón **Code → Download ZIP** en GitHub, o `git clone <url-del-repositorio>`.
2. Descomprime la carpeta.
3. Abre `prototipo/index.html` con doble clic.
4. En la pantalla de ingreso, elige una cuenta de demostración.

Los datos se guardan en el almacenamiento local del navegador. Para volver al estado inicial, usa **Reiniciar demo** en la barra superior.

## 3. Publicarlo en GitHub Pages (opcional)

1. Sube el repositorio a GitHub.
2. Entra a **Settings → Pages**.
3. En **Source** elige la rama `main` y la carpeta `/ (root)`. Guarda.
4. Espera uno o dos minutos. El prototipo queda en `https://<usuario>.github.io/<repositorio>/prototipo/`.

## 4. Ejecutar las pruebas automáticas

```bash
cd <carpeta-del-repositorio>
npm init -y
npm install playwright
npx playwright install chromium        # o usa tu Chrome con CHROME_PATH
node tests/pruebas.mjs                 # ejecuta las 26 pruebas
node tests/capturas.mjs                # regenera las capturas de docs/img
```

Si ya tienes Chrome instalado: `CHROME_PATH="/ruta/a/chrome" node tests/pruebas.mjs` (en Windows PowerShell: `$env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"`).

El resultado se muestra en pantalla y se guarda en `tests/resultados.json`.

## 5. Despliegue de la versión real (planificado, no ejecutado)

La versión productiva definida en el informe final necesita, además:

| Componente | Propuesta | Responsable |
|---|---|---|
| Servidor | Servidor institucional Santo Tomás (Linux), detrás de HTTPS | Área de TI |
| Backend | API REST en Node.js | Equipo de desarrollo |
| Base de datos | PostgreSQL con el modelo descrito en el informe | Equipo de desarrollo |
| Autenticación | SSO institucional (SAML 2.0 u OpenID Connect) | Área de TI |
| Correo | SMTP institucional para comprobantes | Área de TI |
| Inventario | Inventario paralelo del mesón; lectura de solo consulta del sistema bibliotecario si TI lo autoriza | Biblioteca y TI |

Estos pasos dependen de los acuerdos con Biblioteca y TI (riesgos R01, R02 y R06 del informe).
