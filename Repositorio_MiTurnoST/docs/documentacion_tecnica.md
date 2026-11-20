# Documentación técnica interna · Prototipo MiTurno ST v2

Documento breve para que cualquier integrante entienda y modifique el prototipo.

## 1. Qué es real y qué es simulado

| Función | En el prototipo | En la versión real |
|---|---|---|
| Inicio de sesión | Simulado: valida dominio del correo y un prefijo `inactivo` | SSO institucional (SAML / OpenID Connect) |
| Matrícula | Número ficticio calculado desde el correo | Dato del sistema académico vía SSO |
| Inventario | Lista fija de 20 recursos en el navegador | Inventario paralelo del mesón en base de datos |
| Correo de comprobante | Se muestra en "Correo institucional (simulado)" | Envío por SMTP institucional |
| Reloj | Hora simulada que se adelanta con botones | Hora del servidor |
| Almacenamiento | `localStorage` del navegador | PostgreSQL en servidor de TI |
| Auditoría | Eventos de solo agregado (`Object.freeze`) | Tabla con permisos de solo inserción y respaldo |

## 2. Estructura del archivo `prototipo/index.html`

Un solo archivo, sin librerías. El código está dividido en 7 secciones comentadas:

1. **Estilos:** variables de color (`:root`) y modo oscuro (`[data-theme="dark"]`).
2. **Configuración y datos de demostración:** `estadoInicial()` crea tipos, recursos y reservas de ejemplo.
3. **Persistencia:** objeto `Almacen` (`cargar`, `guardar`, `borrar`) sobre `localStorage`, clave `miturnost.v2`.
4. **Reglas de negocio:** funciones puras, sin acceso a la pantalla.
5. **Acciones:** objeto `Acciones`; cada acción valida, cambia el estado, escribe en la auditoría y guarda.
6. **Vistas:** funciones que devuelven HTML (`vistaLogin`, `vistaDisponibilidad`, `vistaMisReservas`, `vistaMeson`, `vistaAdmin`, `vistaModal`).
7. **Eventos y arranque:** un solo `addEventListener` por tipo de evento, que usa el atributo `data-act` de los botones.

Flujo: **evento → `accion()` → `Acciones.x()` → `render()`**. La pantalla siempre se dibuja completa desde el estado.

## 3. Modelo de datos (estado)

```text
estado
├── ahora            minutos desde 00:00 (hora simulada)
├── params           { tolerancia: 15, apertura: 480, cierre: 1200 }
├── tipos            { clave: { nombre, plural, modalidad: 'hora'|'dia', maximo, prefijo, icono } }
├── recursos[]       { id, tipo, nombre, lugar, mantencion }
├── reservas[]       { id, recurso, correo, nombre, inicio, fin, estado, codigo }
├── eventos[]        { n, t, accion, usuario, recurso, detalle }   ← auditoría
└── avisos[]         { t, correo, msg }                             ← "correos" enviados
```

Estados de una reserva:

```text
reservada ──(mesón entrega)──► en_uso ──(mesón recibe)──► completada
    │                                         
    ├──(estudiante cancela antes del inicio)──► cancelada
    └──(pasan 15 min sin retiro)──────────────► expirada
```

## 4. Reglas de negocio (sección 4 del código)

| Función | Regla |
|---|---|
| `validarReserva()` | Recurso no en mantención; dentro del horario; bloque no pasado; sin cruce con otra reserva; cupo diario (2 h boxes, 1 préstamo calculadora o tablet); sin dos recursos del mismo tipo a la vez |
| `vencerReservas()` | Reserva `reservada` con `ahora >= inicio + tolerancia` pasa a `expirada` |
| `estadoBloque()` | libre / reservado / ocupado / bloqueado / mantencion / pasado |
| `cupoUsado()` | Suma horas (modalidad hora) o cuenta préstamos (modalidad día) en estados reservada, en_uso y completada |
| `duracionMaxima()` | Cuántas horas seguidas se pueden pedir desde un bloque |

Para cambiar una regla, edita solo esa función y vuelve a ejecutar `node tests/pruebas.mjs`.

## 5. Cómo agregar algo

- **Nuevo tipo de recurso:** desde Administración → Catálogo (sin tocar código), o en `estadoInicial()` dentro de `tipos`.
- **Nueva pantalla:** crea `vistaX()`, agrégala en `pestañas()` para el rol que corresponda y en el mapa de `render()`.
- **Nueva acción:** agrega un método en `Acciones` (que llame a `registrar()` y `guardar()`) y un `case` en `accion()`.

## 6. Pruebas

`tests/pruebas.mjs` abre el prototipo en Chrome con Playwright y usa `window.MiTurno` (acciones y reglas expuestas) para verificar 26 casos: autenticación y roles, reglas de reserva, mesón, administración, auditoría, persistencia, XSS, vista móvil y tiempo de carga.

## 7. Cambios respecto del prototipo v1

| Incidencia en v1 | Cambio en v2 |
|---|---|
| Se perdían todas las reservas al recargar | Persistencia en `localStorage` |
| El personal de mesón tenía acceso a Administración | Tres roles: estudiante, mesón y administración |
| Se podía ingresar sin contraseña | El formulario exige contraseña (sigue siendo simulado) |
| La cuota de tablets decía "Una calculadora por día" | Texto según el tipo de recurso |
| No había forma de bloquear un recurso dañado | Sección "Recursos en mantención" (riesgo R12) |
| La auditoría no se podía exportar y los eventos no tenían número | Numeración correlativa, eventos inmutables y exportación CSV |
| Dependía de Google Fonts (sin internet cambiaba el diseño) | Tipografía del sistema, cero dependencias externas |
| `<title>` y `<meta>` dentro de `<body>` | HTML válido con `<head>` y `lang="es"` |
| Solo citaba la Ley 19.628 | Cita la Ley 19.628 y los principios de la Ley 21.719 |
