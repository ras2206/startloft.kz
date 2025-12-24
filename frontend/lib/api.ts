const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  async getTournaments(status?: string) {
    const url = status 
      ? `${API_URL}/api/tournaments?status=${status}`
      : `${API_URL}/api/tournaments`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch tournaments');
    return res.json();
  },

  async getTournamentById(id: string) {
    const res = await fetch(`${API_URL}/api/tournaments/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Tournament not found');
    return res.json();
  },

  async getClubSettings() {
    const res = await fetch(`${API_URL}/api/club-settings`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch club settings');
    return res.json();
  },

  async getParticipants(tournamentId: string) {
    const res = await fetch(`${API_URL}/api/tournaments/${tournamentId}/registrations`);
    if (!res.ok) return [];
    return res.json();
  },

  async createRegistration(data: any) {
    const res = await fetch(`${API_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.detail || 'Ошибка регистрации');
    }
    
    return result;
  },
};
