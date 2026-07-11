const BASE_URL = '/api/proxy';

const q = (p) => p ? '?' + new URLSearchParams(p) : '';

async function call(endpoint, token, options = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(`Cannot reach API at ${BASE_URL}. Make sure the Django server is running and CORS allows this frontend port.`);
  }

  if (!res.ok) {
    const text = await res.text();

    console.log("URL:", `${BASE_URL}${endpoint}`);
    console.log("Status:", res.status);
    console.log("Response Text:", text);

    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.status === 204 ? null : res.json();
}

// Public — no token needed
export const categories = {
  list: () => call('/transactions/categories/'),
};

// All others need token — use makeAPI(token) in components
export function makeAPI(token) {
  return {
    transactions: {
      list:   (p)      => call(`/transactions/transactions/${q(p)}`, token),
      create: (data)   => call('/transactions/transactions/', token, { method: 'POST', body: JSON.stringify(data) }),
      update: (id, d)  => call(`/transactions/transactions/${id}/`, token, { method: 'PUT', body: JSON.stringify(d) }),
      delete: (id)     => call(`/transactions/transactions/${id}/`, token, { method: 'DELETE' }),
    },
    bills: {
      list:     ()     => call('/bills/recurring/', token),
      create:   (data) => call('/bills/recurring/', token, { method: 'POST', body: JSON.stringify(data) }),
      update:   (id,d) => call(`/bills/recurring/${id}/`, token, { method: 'PUT', body: JSON.stringify(d) }),
      delete:   (id)   => call(`/bills/recurring/${id}/`, token, { method: 'DELETE' }),
      upcoming: ()     => call('/bills/upcoming/', token),
      pay:      (id)   => call(`/bills/pay/${id}/`, token, { method: 'POST' }),
      order:    (id)   => call(`/bills/pay-order/${id}/`, token, { method: 'POST' }),
      verify:   (id, data) => call(`/bills/pay-verify/${id}/`, token, { method: 'POST', body: JSON.stringify(data) }),
    },
    categories: {
      list:   (p)      => call(`/transactions/categories/${q(p)}`, token),
    },
    reports: {
      monthly:     (p)    => call(`/reports/monthly/${q(p)}`, token),
      yearly:      (p)    => call(`/reports/yearly/${q(p)}`, token),
      taxEstimate: (data) => call('/reports/tax/estimate/', token, { method: 'POST', body: JSON.stringify(data) }),
      tax80c:      (p)    => call(`/reports/tax/80c/${q(p)}`, token),
      anomalies:   (p)    => call(`/reports/anomalies/${q(p)}`, token),
      aiChat:      (msg)  => call('/reports/ai/chat/', token, { method: 'POST', body: JSON.stringify({ message: msg }) }),
    },
  };
}
