const $ = selector => document.querySelector(selector);
let clientes = [];
let clienteEditando = null;
let grafico = null;
let espera = null;

function mostrarPanel(visible) {
  $('#vistaLogin').classList.toggle('hidden', visible);
  $('#vistaPanel').classList.toggle('hidden', !visible);
}

function mostrarVista(nombre) {
  document.querySelectorAll('.vista').forEach(seccion => seccion.classList.toggle('hidden', seccion.id !== `vista-${nombre}`));
  document.querySelectorAll('[data-vista]').forEach(boton => boton.setAttribute('aria-selected', boton.dataset.vista === nombre));
}

function manejarError(error) {
  if (error.status === 401) {
    document.querySelectorAll('dialog[open]').forEach(dialogo => dialogo.close());
    alerta('Tu sesión expiró. Ingresa de nuevo.', 'warning');
    mostrarPanel(false);
    return;
  }
  alerta(error.message, 'error');
}

function errorEnFormulario(formulario, mensaje) {
  let aviso = formulario.querySelector('.aviso-error');
  if (!aviso) {
    aviso = document.createElement('p');
    aviso.className = 'aviso-error rounded-xl bg-[#FEE2E2] px-4 py-3 text-sm text-[#B91C1C]';
    formulario.querySelector('button.boton-primario').before(aviso);
  }
  aviso.textContent = mensaje;
}

function fallo(error, formulario) {
  if (error.status === 401) return manejarError(error);
  errorEnFormulario(formulario, error.message);
}

const fila = (etiqueta, valor) => `<div class="flex justify-between gap-4 py-2.5"><dt class="text-slate-500">${etiqueta}</dt><dd class="text-right font-semibold">${valor}</dd></div>`;

function dibujarResumen(datos) {
  $('#totalClientes').textContent = datos.totalClientes;
  $('#clientesActivos').textContent = datos.clientesActivos;
  $('#clientesBloqueados').textContent = datos.clientesBloqueados;
  $('#saldoTotal').textContent = dinero(datos.saldoTotal);
  const inactivos = datos.totalClientes - datos.clientesActivos - datos.clientesBloqueados;
  const valores = [datos.clientesActivos, inactivos, datos.clientesBloqueados];
  if (grafico) {
    grafico.data.datasets[0].data = valores;
    grafico.update();
    return;
  }
  grafico = new Chart($('#graficoEstados'), {
    type: 'doughnut',
    data: {
      labels: ['Activos', 'Inactivos', 'Bloqueados'],
      datasets: [{ data: valores, backgroundColor: ['#16A34A', '#94A3B8', '#DC2626'], borderWidth: 0 }]
    },
    options: {
      cutout: '68%',
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Plus Jakarta Sans' } } } }
    }
  });
}

function dibujarClientes() {
  $('#sinClientes').classList.toggle('hidden', clientes.length > 0);
  $('#listaClientes').innerHTML = clientes.map(c => {
    const activo = c.estado === 'ACTIVO';
    return `<tr class="fila">
      <td class="px-6 py-4"><p class="font-semibold">${escapar(c.nombre)}</p><p class="text-slate-500">${escapar(c.correo)}</p></td>
      <td class="num px-6 py-4">${escapar(c.cuenta?.numero_cuenta ?? '—')}</td>
      <td class="num px-6 py-4 text-right font-semibold">${c.cuenta ? dinero(c.cuenta.saldo) : '—'}</td>
      <td class="px-6 py-4">${insignia(c.estado)}</td>
      <td class="acciones px-6 py-4 text-right">
        <button class="icono-accion" data-accion="ver" data-id="${c.id}" title="Ver detalle"><i data-lucide="eye" class="h-4 w-4"></i></button>
        <button class="icono-accion" data-accion="editar" data-id="${c.id}" title="Editar"><i data-lucide="pencil" class="h-4 w-4"></i></button>
        <button class="icono-accion" data-accion="estado" data-id="${c.id}" title="${activo ? 'Bloquear' : 'Habilitar'}"><i data-lucide="${activo ? 'lock' : 'lock-open'}" class="h-4 w-4"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function dibujarCuentas(cuentas) {
  $('#listaCuentas').innerHTML = cuentas.map(c => `<tr class="fila">
    <td class="num px-6 py-4 font-semibold">${escapar(c.numero_cuenta)}</td>
    <td class="px-6 py-4">${escapar(c.usuario.nombre)}</td>
    <td class="px-6 py-4">${c.tipo_cuenta === 'AHORROS' ? 'Ahorros' : 'Corriente'}</td>
    <td class="num px-6 py-4 text-right font-semibold">${dinero(c.saldo)}</td>
    <td class="px-6 py-4">${insignia(c.usuario.estado)}</td>
    <td class="acciones px-6 py-4 text-right"><button class="icono-accion" data-numero="${escapar(c.numero_cuenta)}" title="Consignar"><i data-lucide="banknote" class="h-4 w-4"></i></button></td>
  </tr>`).join('');
}

function dibujarMovimientos(movimientos) {
  $('#sinMovimientos').classList.toggle('hidden', movimientos.length > 0);
  $('#listaMovimientos').innerHTML = movimientos.map(m => {
    const color = Number(m.valor) < 0 ? 'text-red-600' : 'text-green-600';
    const signo = Number(m.valor) > 0 ? '+' : '';
    return `<tr class="fila">
      <td class="px-6 py-4"><div class="flex items-center gap-3">${iconoMovimiento(m.tipo)}<span class="font-semibold">${escapar(tiposMovimiento[m.tipo].texto)}</span></div></td>
      <td class="whitespace-nowrap px-6 py-4 text-slate-500">${escapar(fecha(m.fecha))}</td>
      <td class="num px-6 py-4">${escapar(m.cuenta.numero_cuenta)}</td>
      <td class="px-6 py-4">${escapar(m.cuenta.usuario.nombre)}</td>
      <td class="px-6 py-4">${escapar(m.descripcion)}</td>
      <td class="num px-6 py-4 text-right font-semibold ${color}">${signo}${dinero(m.valor)}</td>
      <td class="num px-6 py-4 text-right">${dinero(m.saldo_resultante)}</td>
    </tr>`;
  }).join('');
}

async function cargarClientes() {
  clientes = await peticion(`/clientes/obtener?buscar=${encodeURIComponent($('#buscar').value.trim())}`);
  dibujarClientes();
  lucide.createIcons();
}

async function cargarTodo() {
  const [resumen, cuentas, movimientos] = await Promise.all([
    peticion('/cuentas/dashboard'),
    peticion('/cuentas/obtener'),
    peticion('/movimientos/obtener'),
    cargarClientes()
  ]);
  mostrarPanel(true);
  dibujarResumen(resumen);
  dibujarCuentas(cuentas);
  dibujarMovimientos(movimientos);
  lucide.createIcons();
}

function abrirFormularioCliente(cliente) {
  const formulario = $('#formCliente');
  clienteEditando = cliente ? cliente.id : null;
  formulario.reset();
  formulario.querySelector('.aviso-error')?.remove();
  $('#tituloCliente').textContent = cliente ? 'Editar cliente' : 'Nuevo cliente';
  $('#camposNuevo').disabled = Boolean(cliente);
  $('#camposNuevo').classList.toggle('hidden', Boolean(cliente));
  if (cliente) {
    formulario.nombre.value = cliente.nombre;
    formulario.correo.value = cliente.correo;
    formulario.telefono.value = cliente.telefono ?? '';
    formulario.direccion.value = cliente.direccion ?? '';
  }
  $('#dlgCliente').showModal();
}

function abrirConsignacion(numero = '') {
  const formulario = $('#formConsignar');
  formulario.reset();
  formulario.querySelector('.aviso-error')?.remove();
  formulario.numero_cuenta.value = numero;
  $('#dlgConsignar').showModal();
}

async function verDetalle(id) {
  const c = await peticion(`/clientes/obtener/${id}`);
  $('#detalleCliente').innerHTML = `<dl class="divide-y divide-slate-100 text-sm">
    ${fila('Nombre', escapar(c.nombre))}
    ${fila('Correo', escapar(c.correo))}
    ${fila('Teléfono', escapar(c.telefono || '—'))}
    ${fila('Dirección', escapar(c.direccion || '—'))}
    ${fila('Estado', insignia(c.estado))}
    ${fila('Cliente desde', escapar(fecha(c.createdAt)))}
    ${fila('Cuenta', `<span class="num">${escapar(c.cuenta.numero_cuenta)}</span>`)}
    ${fila('Tipo de cuenta', c.cuenta.tipo_cuenta === 'AHORROS' ? 'Ahorros' : 'Corriente')}
    ${fila('Saldo', `<span class="num">${dinero(c.cuenta.saldo)}</span>`)}
  </dl>`;
  $('#dlgDetalle').showModal();
}

async function cambiarEstado(cliente) {
  const bloquear = cliente.estado === 'ACTIVO';
  const acepta = await confirmar(
    bloquear ? '¿Bloquear cliente?' : '¿Habilitar cliente?',
    bloquear ? `${cliente.nombre} no podrá iniciar sesión ni realizar operaciones.` : `${cliente.nombre} podrá volver a operar.`
  );
  if (!acepta) return;
  await peticion(`/clientes/estado/${cliente.id}`, 'PUT', { estado: bloquear ? 'BLOQUEADO' : 'ACTIVO' });
  alerta(bloquear ? 'Cliente bloqueado' : 'Cliente habilitado');
  await cargarTodo();
}

document.querySelectorAll('[data-vista]').forEach(boton => boton.addEventListener('click', () => mostrarVista(boton.dataset.vista)));
document.querySelectorAll('.cerrar-dialogo').forEach(boton => boton.addEventListener('click', () => boton.closest('dialog').close()));

$('#formLogin').addEventListener('submit', async evento => {
  evento.preventDefault();
  try {
    const usuario = await peticion('/auth/login', 'POST', Object.fromEntries(new FormData(evento.target)));
    if (usuario.rol !== 'ADMIN') {
      await peticion('/auth/logout', 'POST');
      throw new Error('Este acceso es solo para el personal del banco. Usa la banca virtual.');
    }
    evento.target.reset();
    $('#saludo').textContent = usuario.nombre;
    await cargarTodo();
  } catch (error) {
    alerta(error.message, 'error');
  }
});

$('#btnSalir').addEventListener('click', async () => {
  await peticion('/auth/logout', 'POST');
  location.reload();
});

$('#buscar').addEventListener('input', () => {
  clearTimeout(espera);
  espera = setTimeout(() => cargarClientes().catch(manejarError), 250);
});

$('#btnNuevoCliente').addEventListener('click', () => abrirFormularioCliente(null));
$('#btnConsignar').addEventListener('click', () => abrirConsignacion());

$('#listaClientes').addEventListener('click', async evento => {
  const boton = evento.target.closest('[data-accion]');
  if (!boton) return;
  const cliente = clientes.find(c => c.id === Number(boton.dataset.id));
  try {
    if (boton.dataset.accion === 'ver') await verDetalle(cliente.id);
    if (boton.dataset.accion === 'editar') abrirFormularioCliente(cliente);
    if (boton.dataset.accion === 'estado') await cambiarEstado(cliente);
  } catch (error) {
    manejarError(error);
  }
});

$('#listaCuentas').addEventListener('click', evento => {
  const boton = evento.target.closest('[data-numero]');
  if (boton) abrirConsignacion(boton.dataset.numero);
});

$('#formCliente').addEventListener('submit', async evento => {
  evento.preventDefault();
  const datos = Object.fromEntries(new FormData(evento.target));
  try {
    if (clienteEditando) {
      await peticion(`/clientes/actualizar/${clienteEditando}`, 'PUT', datos);
    } else {
      await peticion('/clientes/crear', 'POST', datos);
    }
    $('#dlgCliente').close();
    alerta(clienteEditando ? 'Cliente actualizado' : 'Cliente creado');
    await cargarTodo();
  } catch (error) {
    fallo(error, evento.target);
  }
});

$('#formConsignar').addEventListener('submit', async evento => {
  evento.preventDefault();
  const datos = Object.fromEntries(new FormData(evento.target));
  datos.valor = Number(datos.valor);
  try {
    await peticion('/movimientos/consignar', 'POST', datos);
    $('#dlgConsignar').close();
    alerta('Consignación realizada');
    await cargarTodo();
  } catch (error) {
    fallo(error, evento.target);
  }
});

async function iniciar() {
  lucide.createIcons();
  try {
    const usuario = await peticion('/auth/sesion');
    if (usuario.rol !== 'ADMIN') return;
    $('#saludo').textContent = usuario.nombre;
    await cargarTodo();
  } catch (error) {
    if (error.status !== 401) alerta(error.message, 'error');
  }
}

iniciar();