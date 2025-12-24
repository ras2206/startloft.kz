export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number, currency: string = 'KZT'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatPhone(phone: string): string {
  // +77071234567 -> +7 (707) 123-45-67
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`;
  }
  return phone;
}

export function normalizePhone(phone: string): string {
  // Убираем все кроме цифр и +
  return phone.replace(/[^\d+]/g, '');
}

export function getTournamentStatus(tournament: any): string {
  if (tournament.registration_open) return 'Открыт';
  if (tournament.status === 'finished') return 'Завершён';
  return 'Скоро';
}

export function getTournamentStatusColor(tournament: any): string {
  if (tournament.registration_open) return 'bg-green-500';
  if (tournament.status === 'finished') return 'bg-gray-500';
  return 'bg-yellow-500';
}
