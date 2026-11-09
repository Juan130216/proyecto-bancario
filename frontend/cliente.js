const $ = selector => document.querySelector(selector);
let cuenta = null;
let numeroVisible = false;

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
    alerta('Tu sesión expiró. Ingresa de nuevo.', 'warning');
    mostrarPanel(false);
    return;
  }
  alerta(error.message, 'error');
}

function pintarNumero() {
  $('#numeroCuenta').textContent = numeroVisible ? cuenta.numero_cuenta : `**** **** ${cuenta.numero_cuenta.slice(-4)}`;
  $('#btnVerNumero').textContent = numeroVisible ? 'Ocultar número' : 'Mostrar número';
}

function dibujarPerfil(perfil) {
  cuenta = perfil.cuenta;
  $('#saludo').textContent = perfil.nombre;
  $('#saldo').textContent = dinero(cuenta.saldo);
  $('#tipoCuenta').textContent = cuenta.tipo_cuenta === 'AHORROS' ? 'Ahorros' : 'Corriente';
  pintarNumero();
  $('#perfilNombre').textContent = perfil.nombre;
  $('#perfilCorreo').textContent = perfil.correo;
  $('#perfilEstado').innerHTML = insignia(perfil.estado);
  $('#formPerfil').telefono.value = perfil.telefono ?? '';
  $('#formPerfil').direccion.value = perfil.direccion ?? '';
}

function dibujarMovimientos(movimientos) {
  $('#sinMovimientos').classList.toggle('hidden', movimientos.length > 0);
  $('#listaMovimientos').innerHTML = movimientos.map(m => {
    const color = Number(m.valor) < 0 ? 'text-red-600' : 'text-green-600';
    const signo = Number(m.valor) > 0 ? '+' : '';
    return `<tr class="fila">
      <td class="px-6 py-4"><div class="flex items-center gap-3">${iconoMovimiento(m.tipo)}<span class="font-semibold">${escapar(tiposMovimiento[m.tipo].texto)}</span></div></td>
      <td class="whitespace-nowrap px-6 py-4 text-slate-500">${escapar(fecha(m.fecha))}</td>
      <td class="px-6 py-4">${escapar(m.descripcion)}</td>
      <td class="num px-6 py-4 text-right font-semibold ${color}">${signo}${dinero(m.valor)}</td>
      <td class="num px-6 py-4 text-right">${dinero(m.saldo_resultante)}</td>
    </tr>`;
  }).join('');
}

async function cargarPanel() {
  const [perfil, movimientos] = await Promise.all([peticion('/clientes/perfil'), peticion('/movimientos/propios')]);
  dibujarPerfil(perfil);
  dibujarMovimientos(movimientos);
  mostrarPanel(true);
  lucide.createIcons();
}

document.querySelectorAll('[data-vista]').forEach(boton => boton.addEventListener('click', () => mostrarVista(boton.dataset.vista)));

$('#btnVerNumero').addEventListener('click', () => {
  numeroVisible = !numeroVisible;
  pintarNumero();
});

$('#formLogin').addEventListener('submit', async evento => {
  evento.preventDefault();
  try {
    const usuario = await peticion('/auth/login', 'POST', Object.fromEntries(new FormData(evento.target)));
    if (usuario.rol !== 'CLIENTE') {
      await peticion('/auth/logout', 'POST');
      throw new Error('Esta es la banca virtual de clientes. Usa el panel administrativo.');
    }
    evento.target.reset();
    await cargarPanel();
  } catch (error) {
    manejarError(error);
  }
});

$('#btnSalir').addEventListener('click', async () => {
  await peticion('/auth/logout', 'POST');
  location.reload();
});

$('#formTransferir').addEventListener('submit', async evento => {
  evento.preventDefault();
  const datos = Object.fromEntries(new FormData(evento.target));
  datos.valor = Number(datos.valor);
  const acepta = await confirmar('¿Confirmar transferencia?', `Vas a enviar ${dinero(datos.valor)} a la cuenta ${datos.numero_cuenta_destino}.`);
  if (!acepta) return;
  try {
    await peticion('/transferencias/crear', 'POST', datos);
    evento.target.reset();
    alerta('Transferencia realizada');
    await cargarPanel();
  } catch (error) {
    manejarError(error);
  }
});

$('#formPerfil').addEventListener('submit', async evento => {
  evento.preventDefault();
  try {
    await peticion('/clientes/perfil', 'PUT', Object.fromEntries(new FormData(evento.target)));
    alerta('Perfil actualizado');
    await cargarPanel();
  } catch (error) {
    manejarError(error);
  }
});

$('#formPassword').addEventListener('submit', async evento => {
  evento.preventDefault();
  try {
    await peticion('/clientes/password', 'PUT', Object.fromEntries(new FormData(evento.target)));
    evento.target.reset();
    alerta('Contraseña actualizada');
  } catch (error) {
    manejarError(error);
  }
});

lucide.createIcons();
cargarPanel().catch(error => {
  if (![401, 403].includes(error.status)) alerta(error.message, 'error');
});