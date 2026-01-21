
const API_URL = '/api';

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erreur Serveur (${res.status}): ${errorText || res.statusText}`);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return null;
}

export const api = {
  // --- INITIALISATION ---
  initializeBuilding: async (apartments: any[]) => {
    const res = await fetch(`${API_URL}/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apartments }),
    });
    return handleResponse(res);
  },

  // --- APPARTEMENTS ---
  getApartments: async () => {
    try {
      const res = await fetch(`${API_URL}/apartments`);
      const data = await handleResponse(res);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn("API Offline: Utilisation du cache local");
      const cached = localStorage.getItem('cache_apartments');
      return cached ? JSON.parse(cached) : [];
    }
  },
  
  updateApartment: async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/apartments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- FINANCES ---
  getFinances: async (year: number) => {
    try {
      const res = await fetch(`${API_URL}/finances?year=${year}`);
      const data = await handleResponse(res);
      return data || { payments: [], expenses: [] };
    } catch (e) {
      return { payments: [], expenses: [] };
    }
  },

  togglePayment: async (paymentData: any) => {
    const res = await fetch(`${API_URL}/payments/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    return handleResponse(res);
  },

  // --- OPERATIONS ---
  getOperations: async () => {
    try {
      const res = await fetch(`${API_URL}/operations`);
      const data = await handleResponse(res);
      return data || { projects: [], complaints: [] };
    } catch (e) {
      return { projects: [], complaints: [] };
    }
  },

  createOperation: async (type: 'project' | 'complaint', data: any) => {
    const res = await fetch(`${API_URL}/operations/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateOperation: async (type: 'project' | 'complaint', id: string, data: any) => {
    const res = await fetch(`${API_URL}/operations/${type}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteOperation: async (type: 'project' | 'complaint', id: string) => {
    const res = await fetch(`${API_URL}/operations/${type}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Erreur suppression");
  }
};
