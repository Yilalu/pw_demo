// Send same-origin JSON requests so the browser includes the EcoLife session cookie.
export async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'same-origin',
  });
  // Convert API failures into Error objects so pages can show the server's message.
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

// Shared category names keep filters and dashboard activity categories consistent.
export const categories = ['All', 'Food', 'Energy', 'Transport', 'Waste', 'Nature', 'Fashion'];
