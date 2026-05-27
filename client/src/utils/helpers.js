export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function riskColor(riskLevel) {
  const map = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
    safe: '#22c55e',
    suspicious: '#f59e0b',
    likely_scam: '#ef4444',
    confirmed_scam: '#dc2626',
  };
  return map[riskLevel] || '#6b7280';
}

export function riskLabel(riskLevel) {
  const map = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical',
    safe: 'Safe',
    suspicious: 'Suspicious',
    likely_scam: 'Likely Scam',
    confirmed_scam: 'Confirmed Scam',
  };
  return map[riskLevel] || riskLevel;
}

export function getErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.errors?.[0]?.msg ||
    err?.message ||
    'Something went wrong'
  );
}

export function scoreToPercent(score) {
  return Math.min(Math.max(Math.round(score), 0), 100);
}
