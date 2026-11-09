const API = '/api';

async function peticion(ruta, metodo = 'GET', cuerpo) {
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || 'Error en la petición');
    error.status = respuesta.status;
    throw error;
  }
  return datos.resultado;
}

function escapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]);
}

const aviso = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3500, timerProgressBar: true });
function alerta(mensaje, tipo = 'success') {
  aviso.fire({ icon: tipo, title: mensaje });
}

async function confirmar(titulo, texto) {
  const { isConfirmed } = await Swal.fire({
    title: titulo,
    text: texto,
    icon: 'question',
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#2563EB',
    customClass: { popup: 'rounded-2xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl' }
  });
  return isConfirmed;
}

const dinero = valor => Number(valor).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fecha = valor => new Date(valor).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

const coloresEstado = {
  ACTIVO: 'bg-[#DCFCE7] text-[#15803D]',
  INACTIVO: 'bg-[#F1F5F9] text-[#475569]',
  BLOQUEADO: 'bg-[#FEE2E2] text-[#B91C1C]'
};
const insignia = estado => `<span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${coloresEstado[estado]}">${estado.charAt(0) + estado.slice(1).toLowerCase()}</span>`;

const tiposMovimiento = {
  CONSIGNACION: { texto: 'Consignación', entra: true },
  TRANSFERENCIA_RECIBIDA: { texto: 'Transferencia recibida', entra: true },
  TRANSFERENCIA_ENVIADA: { texto: 'Transferencia enviada', entra: false },
  RETIRO_CAJERO: { texto: 'Retiro en cajero', entra: false }
};
const iconoMovimiento = tipo => tiposMovimiento[tipo].entra
  ? '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700"><i data-lucide="arrow-down" class="h-5 w-5"></i></span>'
  : '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700"><i data-lucide="arrow-up" class="h-5 w-5"></i></span>';