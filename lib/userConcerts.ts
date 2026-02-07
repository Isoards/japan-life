export interface UserConcert {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  venue: string;
  city: string;
  memo: string;
}

export async function getUserConcerts(): Promise<UserConcert[]> {
  try {
    const res = await fetch("/api/user-concerts");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function addUserConcert(
  concert: Omit<UserConcert, "id">
): Promise<UserConcert> {
  const res = await fetch("/api/user-concerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(concert),
  });
  return await res.json();
}

export async function deleteUserConcert(id: string): Promise<void> {
  await fetch("/api/user-concerts", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}
