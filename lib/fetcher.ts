/** SWR용 범용 JSON fetcher */
export const fetcher = async <T = unknown>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
};
