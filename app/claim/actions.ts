"use server";

import { readClaimed, writeClaimed } from "../../lib/claimed-spots";

export async function claimSpot(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const restaurantId = formData.get("restaurantId")?.toString().trim();
  const restaurantName = formData.get("restaurantName")?.toString().trim();
  const contactName = formData.get("contactName")?.toString().trim();
  const contactEmail = formData.get("contactEmail")?.toString().trim().toLowerCase();

  if (!restaurantId || !restaurantName || !contactName || !contactEmail) {
    return { success: false, error: "All fields are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const store = readClaimed();
  store[restaurantId] = {
    restaurantId,
    restaurantName,
    contactName,
    contactEmail,
    claimedAt: new Date().toISOString(),
  };
  writeClaimed(store);

  return { success: true };
}
