import type { Slot } from "@shared/schema";

export async function searchSlots(query: string): Promise<Slot[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await fetch(`/api/slots/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search slots');
    return await response.json();
  } catch (error) {
    console.error('Error searching slots:', error);
    return [];
  }
}

export async function getSlotDetails(name: string): Promise<Slot | null> {
  try {
    const response = await fetch(`/api/slots/${encodeURIComponent(name)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching slot details:', error);
    return null;
  }
}
