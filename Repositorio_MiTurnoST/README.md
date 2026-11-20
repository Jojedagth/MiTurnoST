# MiTurno ST

Portal web para consultar y reservar los recursos no bibliográficos (boxes de estudio, calculadoras y tablets) de la Biblioteca Santo Tomás, sede La Serena.

Proyecto de la asignatura **Gestión de Proyectos y Equipos de Trabajo**, Ingeniería en Informática, Instituto Profesional Santo Tomás.
Equipo: Julián Ojeda, Benjamín Santander y Martín Araya.

> **Estado:** prototipo funcional (v2). Toda la lógica corre en el navegador con datos ficticios. El SSO, el correo y la conexión con el inventario de la biblioteca están **simulados**. Ver "Qué es real y qué es simulado" en `docs/documentacion_tecnica.md`.

## Contenido del repositorio

| Ruta | Qué es |
|---|---|
| `prototipo/index.html` | El prototipo completo (un solo archivo, sin dependencias) |
| `docs/manual_instalacion.md` | Cómo abrir, publicar y probar el prototipo desde cero |
| `docs/manual_usuario.md` | Guía ilustrada para estudiantes, mesón y administración |
| `docs/documentacion_tecnica.md` | Documentación interna breve: estructura del código, reglas, modelo de datos |
| `docs/img/` | Capturas usadas en los manuales |
| `tests/pruebas.mjs` | 26 pruebas automáticas (reglas de negocio, seguridad, usabilidad) |
| `tests/capturas.mjs` | Script que regenera las capturas de `docs/img/` |
| `tests/resultados.json` | Resultado de la última ejecución de las pruebas |

## Inicio rápido

1. Descarga o clona el repositorio.
2. Abre `prototipo/index.html` con doble clic (Chrome, Edge o Firefox).
3. Entra con una de las **cuentas de demostración** del formulario.

## Cuentas de demostración

| Botón | Correo | Rol |
|---|---|---|
| Estudiante | camila.rojas@alumnos.santotomas.cl | Reserva y cancela |
| Personal de mesón | meson.biblioteca@santotomas.cl | Entrega y recibe recursos |
| Administración | admin.biblioteca@santotomas.cl | Parámetros, catálogo, mantención y auditoría |
| Matrícula no vigente | inactivo.demo@alumnos.santotomas.cl | Muestra el rechazo de acceso |

Cualquier correo `@alumnos.santotomas.cl` entra como estudiante; uno `@santotomas.cl` entra como mesón, o como administración si empieza con `admin`.
