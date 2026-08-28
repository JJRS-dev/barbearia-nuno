// E-mail que identifica o barbeiro (Nuno). A conta cadastrada com este e-mail
// tem acesso ao painel do barbeiro. Todas as outras contas são clientes.
export const BARBER_EMAIL = 'nuno@nunexcortes.com'

export const BARBERSHOP_NAME = 'Nunex Cortes'
export const BARBER_NAME = 'Nuno'

// Duração de cada corte em minutos (define o espaçamento dos horários).
export const SLOT_DURATION_MIN = 45

export function isBarber(email?: string | null) {
  return !!email && email.toLowerCase() === BARBER_EMAIL
}
