export async function githubRequest<T>(token: string, endpoint: string): Promise<T> {
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'GitHub request failed.');
  return data;
}
