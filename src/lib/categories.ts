import { apiFetch, getApiBaseUrl } from './api';
import type { Category } from '@/types/pos';

// API Response type
type CategoriesResponse = {
  data: Category[];
};

export async function testApiConnection(): Promise<boolean> {
  const baseUrl = getApiBaseUrl();

  try {
    console.log("[TEST API] Fetching:", `${baseUrl}/categories`);

    const response = await fetch(`${baseUrl}/categories`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }
    });

    console.log("[TEST API] Status:", response.status, response.statusText);

    return response.ok;
  } catch (error) {
    console.error("[TEST API] Connection failed:", error);
    return false;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const url = `/categories`;

  try {
    console.log("------------------------------------------------");
    console.log("[FETCH CATEGORIES] Requesting:", url);

    const res = await apiFetch<CategoriesResponse>(url);

    console.log("[FETCH CATEGORIES] Raw Response:", res);

    if (!res || typeof res !== "object" || !Array.isArray(res.data)) {
      console.error("[FETCH CATEGORIES] ❌ INVALID FORMAT");
      console.error("[FETCH CATEGORIES] Response Received:", res);
      throw new Error("Invalid API response for categories");
    }

    console.log("[FETCH CATEGORIES] ✔ Categories Loaded:", res.data.length);
    return res.data;

  } catch (error: any) {
    console.error("------------------------------------------------");
    console.error("[FETCH CATEGORIES] ❌ FAILED TO FETCH");

    // Detect if it is a CORS error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("[FETCH CATEGORIES] 🚨 POSSIBLE CORS ERROR");
    }

    console.error("[FETCH CATEGORIES] Error detail:", error);

    return [
      {
        id: "default",
        name: "Umum",
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export async function createCategory(name: string): Promise<Category> {
  const url = `/categories`;

  try {
    console.log("------------------------------------------------");
    console.log("[CREATE CATEGORY] POST:", url, "Payload:", { name });

    const response = await apiFetch<{ data: Category } | Category>(url, {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    console.log("[CREATE CATEGORY] Raw Response:", response);

    if (typeof response === "object" && "data" in response) {
      return response.data;
    }

    return response as Category;

  } catch (error) {
    console.error("[CREATE CATEGORY] ❌ ERROR:", error);
    throw error;
  }
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const url = `/categories/${id}`;

  try {
    console.log("------------------------------------------------");
    console.log("[UPDATE CATEGORY] PUT:", url, "Payload:", { name });

    const response = await apiFetch<{ data: Category } | Category>(url, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });

    console.log("[UPDATE CATEGORY] Raw Response:", response);

    if (typeof response === "object" && "data" in response) {
      return response.data;
    }

    return response as Category;

  } catch (error) {
    console.error("[UPDATE CATEGORY] ❌ ERROR:", error);
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const url = `/categories/${id}`;

  console.log("[DELETE CATEGORY] DELETE:", url);

  return apiFetch<void>(url, {
    method: "DELETE",
  });
}
