// Pruebas automáticas del prototipo MiTurno ST v2.
// Uso:  node tests/pruebas.mjs [ruta/al/index.html]
// Requiere: npm i playwright  (y un Chrome/Chromium instalado)
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const archivo = resolve(process.argv[2] || 'prototipo/index.html');
const url = 'file://' + archivo;
const exe = process.env.CHROME_PATH || undefined;
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errores = [];
page.on('pageerror', e => errores.push(e.message));
await page.goto(url);

const resultados = [];
async function caso(id, nombre, tipo, fn){
  let estado = 'Aprobada', obs = '';
  try { const r = await fn(); if (r !== true){ estado = 'Fallida'; obs = String(r); } }
  catch(e){ estado = 'Fallida'; obs = e.message; }
  resultados.push({ id, nombre, tipo, estado, obs });
  console.log(`${estado === 'Aprobada' ? '✔' : '✘'} ${id} ${nombre}${obs ? ' → ' + obs : ''}`);
}
// Estado limpio + sesión de un usuario
const preparar = (correo) => page.evaluate(c => { const M = window.MiTurno; M.Acciones.reiniciar(); M.app.user = null; if (c) M.Acciones.login(c); M.render(); }, correo);
const ev = (fn, arg) => page.evaluate(fn, arg);
const EST = 'pedro.lagos@alumnos.santotomas.cl', EST2 = 'ana.mella@alumnos.santotomas.cl';
const idDe = nombre => ev(n => window.MiTurno.estado().recursos.find(r => r.nombre === n).id, nombre);

// ---------- Autenticación y roles ----------
await caso('P-01', 'Rechaza correo externo a Santo Tomás', 'Seguridad', async () => {
  await preparar(null); const r = await ev(() => window.MiTurno.Acciones.login('juan@gmail.com', 'x'));
  return !!r.error || 'Aceptó un correo externo';
});
await caso('P-02', 'Rechaza estudiante sin matrícula activa', 'Seguridad', async () => {
  await preparar(null); const r = await ev(() => window.MiTurno.Acciones.login('inactivo.demo@alumnos.santotomas.cl', 'x'));
  return !!r.error || 'Aceptó matrícula inactiva';
});
await caso('P-03', 'Exige contraseña en el formulario de ingreso', 'Seguridad', async () => {
  await preparar(null); const r = await ev(c => window.MiTurno.Acciones.login(c, ''), EST);
  return !!r.error || 'Permitió ingresar sin contraseña';
});
await caso('P-04', 'Separa roles: el mesón no ve Administración', 'Seguridad', async () => {
  await preparar('meson.biblioteca@santotomas.cl');
  const tabs = await page.$$eval('nav.tabs button', b => b.map(x => x.textContent.trim()));
  return !tabs.some(t => t.startsWith('Administración')) || 'Mesón ve la pestaña Administración';
});
await caso('P-05', 'El rol administración ve Administración', 'Funcional', async () => {
  await preparar('admin.biblioteca@santotomas.cl');
  const tabs = await page.$$eval('nav.tabs button', b => b.map(x => x.textContent.trim()));
  return tabs.some(t => t.startsWith('Administración')) || 'No aparece la pestaña';
});

// ---------- Reservas y reglas de negocio ----------
await caso('P-06', 'Reserva un box libre por 1 hora', 'Funcional', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 13, 1), id);
  return r.ok === true || r.error;
});
await caso('P-07', 'Bloquea más de 2 h diarias de box', 'Regla de negocio', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 13, 3), id);
  return !!r.error || 'Permitió 3 h';
});
await caso('P-08', 'Impide reservar un bloque ya tomado por otra persona', 'Regla de negocio', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  await ev(i => window.MiTurno.Acciones.reservar(i, 14, 1), id);
  await ev(c => window.MiTurno.Acciones.login(c), EST2);
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 14, 1), id);
  return !!r.error || 'Permitió doble reserva';
});
await caso('P-09', 'Impide dos recursos del mismo tipo a la misma hora', 'Regla de negocio', async () => {
  await preparar(EST); const a = await idDe('Box 5'), b = await idDe('Box 2');
  await ev(i => window.MiTurno.Acciones.reservar(i, 15, 1), a);
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 15, 1), b);
  return !!r.error || 'Permitió simultaneidad';
});
await caso('P-10', 'Permite solo una calculadora por día', 'Regla de negocio', async () => {
  await preparar(EST); const a = await idDe('Calculadora 5'), b = await idDe('Calculadora 6');
  const r1 = await ev(i => window.MiTurno.Acciones.reservar(i, 12, 1), a);
  const r2 = await ev(i => window.MiTurno.Acciones.reservar(i, 15, 1), b);
  return (r1.ok && !!r2.error) || 'No aplicó el máximo diario';
});
await caso('P-11', 'Cancela antes del inicio y libera el recurso', 'Funcional', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 16, 1), id);
  await ev(x => window.MiTurno.Acciones.cancelar(x), r.reserva.id);
  const st = await ev(i => { const M = window.MiTurno, s = M.estado(); return M.reglas.estadoBloque(s, s.recursos.find(r => r.id === i), 16); }, id);
  return st === 'libre' || 'Estado del bloque: ' + st;
});
await caso('P-12', 'No permite cancelar después de la hora de inicio', 'Regla de negocio', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 11, 1), id);
  await ev(() => window.MiTurno.Acciones.avanzar(55)); // 11:05
  const c = await ev(x => window.MiTurno.Acciones.cancelar(x), r.reserva.id);
  return !!c.error || 'Permitió cancelar';
});
await caso('P-13', 'Libera automáticamente si no se retira en 15 min', 'Regla de negocio', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 11, 1), id);
  await ev(() => window.MiTurno.Acciones.avanzar(65)); // 11:15
  const e = await ev(x => window.MiTurno.estado().reservas.find(b => b.id === x).estado, r.reserva.id);
  return e === 'expirada' || 'Estado: ' + e;
});
await caso('P-14', 'No libera antes de cumplir la tolerancia (minuto 14)', 'Regla de negocio', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 11, 1), id);
  await ev(() => window.MiTurno.Acciones.avanzar(64)); // 11:14
  const e = await ev(x => window.MiTurno.estado().reservas.find(b => b.id === x).estado, r.reserva.id);
  return e === 'reservada' || 'Estado: ' + e;
});

// ---------- Mesón ----------
await caso('P-15', 'Rechaza entrega con código incorrecto', 'Funcional', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 11, 1), id);
  await ev(() => window.MiTurno.Acciones.avanzar(50));
  const e = await ev(x => window.MiTurno.Acciones.entregar(x, 'MT-XXXX'), r.reserva.id);
  return !!e.error || 'Aceptó un código falso';
});
await caso('P-16', 'Entrega con código y el recurso pasa a Ocupado', 'Integración', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 11, 1), id);
  await ev(() => window.MiTurno.Acciones.avanzar(52));
  await ev(([x, c]) => window.MiTurno.Acciones.entregar(x, c), [r.reserva.id, r.reserva.codigo]);
  const s = await ev(i => { const M = window.MiTurno, s = M.estado(); return M.reglas.estadoRecurso(s, s.recursos.find(r => r.id === i)); }, id);
  return s === 'ocupado' || 'Estado: ' + s;
});
await caso('P-17', 'Entrega validando con la matrícula', 'Funcional', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 11, 1), id);
  await ev(() => window.MiTurno.Acciones.avanzar(52));
  const e = await ev(([x, c]) => window.MiTurno.Acciones.entregar(x, window.MiTurno.reglas.matricula(c)), [r.reserva.id, EST]);
  return e.ok === true || e.error;
});
await caso('P-18', 'Devolución deja el recurso libre', 'Integración', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 11, 1), id);
  await ev(() => window.MiTurno.Acciones.avanzar(52));
  await ev(([x, c]) => window.MiTurno.Acciones.entregar(x, c), [r.reserva.id, r.reserva.codigo]);
  await ev(x => window.MiTurno.Acciones.devolver(x), r.reserva.id);
  const s = await ev(i => { const M = window.MiTurno, s = M.estado(); return M.reglas.estadoRecurso(s, s.recursos.find(r => r.id === i)); }, id);
  return s === 'libre' || 'Estado: ' + s;
});

// ---------- Administración ----------
await caso('P-19', 'Recurso en mantención no se puede reservar', 'Regla de negocio', async () => {
  await preparar('admin.biblioteca@santotomas.cl'); const id = await idDe('Box 5');
  await ev(i => window.MiTurno.Acciones.mantencion(i, true), id);
  await ev(c => window.MiTurno.Acciones.login(c), EST);
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 15, 1), id);
  return !!r.error || 'Permitió reservar';
});
await caso('P-20', 'Nuevo tipo de recurso aparece sin cambiar código', 'Escalabilidad', async () => {
  await preparar('admin.biblioteca@santotomas.cl');
  await ev(() => window.MiTurno.Acciones.agregarTipo('Notebook', 3, 'hora', 2));
  await ev(c => { window.MiTurno.Acciones.login(c); location.hash = 'disponibilidad'; window.MiTurno.render(); }, EST);
  const txt = await page.textContent('main');
  return txt.includes('Notebook 1') || 'No aparece en Disponibilidad';
});
await caso('P-21', 'Auditoría registra eventos y no permite editarlos', 'Trazabilidad', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  await ev(i => window.MiTurno.Acciones.reservar(i, 13, 1), id);
  return await ev(() => { const e = window.MiTurno.estado().eventos[0]; const antes = e.accion; try { e.accion = 'x'; } catch(_){} return e.accion === antes && antes === 'Reserva creada'; }) || 'Evento modificable o ausente';
});
await caso('P-22', 'Las reservas sobreviven a recargar la página', 'Persistencia', async () => {
  await preparar(EST); const id = await idDe('Box 5');
  const r = await ev(i => window.MiTurno.Acciones.reservar(i, 17, 1), id);
  await page.reload();
  return await ev(x => window.MiTurno.estado().reservas.some(b => b.id === x), r.reserva.id) || 'Se perdió la reserva';
});
await caso('P-23', 'Texto ingresado no ejecuta código (XSS)', 'Seguridad', async () => {
  await preparar('admin.biblioteca@santotomas.cl');
  await ev(() => { window.__xss = false; window.MiTurno.Acciones.agregarTipo('<img src=x onerror="window.__xss=true">', 1, 'hora', 1); location.hash = 'admin'; window.MiTurno.render(); });
  await page.waitForTimeout(300);
  return (await ev(() => window.__xss)) === false || 'Se ejecutó código inyectado';
});

// ---------- No funcionales ----------
await caso('P-24', 'Sin desborde horizontal en pantalla de teléfono (390 px)', 'Usabilidad', async () => {
  await preparar(EST); await page.setViewportSize({ width: 390, height: 844 });
  await ev(() => { location.hash = 'disponibilidad'; window.MiTurno.render(); });
  const w = await ev(() => document.documentElement.scrollWidth);
  await page.setViewportSize({ width: 1280, height: 900 });
  return w <= 390 || 'Ancho de contenido: ' + w + ' px';
});
await caso('P-25', 'Carga inicial bajo 3 segundos', 'Rendimiento', async () => {
  const t0 = Date.now(); await page.reload({ waitUntil: 'load' }); const t = Date.now() - t0;
  resultados.tiempoCarga = t;
  return t < 3000 || t + ' ms';
});
await caso('P-26', 'Sin errores de JavaScript durante las pruebas', 'Calidad', async () => errores.length === 0 || errores.join(' | '));

await browser.close();
const ok = resultados.filter(r => r.estado === 'Aprobada').length;
console.log(`\n${ok}/${resultados.length} pruebas aprobadas. Carga: ${resultados.tiempoCarga} ms`);
writeFileSync('tests/resultados.json', JSON.stringify({ fecha: new Date().toISOString(), aprobadas: ok, total: resultados.length, tiempoCargaMs: resultados.tiempoCarga, casos: resultados }, null, 2));
process.exit(ok === resultados.length ? 0 : 1);
