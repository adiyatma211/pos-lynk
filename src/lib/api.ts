const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

type ApiOptions = RequestInit & {
  skipJson?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;

  try {
    response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      ...options,
      headers,
    });

    clearTimeout(timeoutId);

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('[CORS ERROR]', {
        url,
        baseUrl,
        error: error.message,
        hint: 'Check CORS config in Laravel'
      });
    }

    throw error;
  }

  // ------ VALIDASI STATUS RESPONSE ------
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    const body = contentType?.includes('application/json')
      ? await response.json()
      : await response.text();

    console.error('[API ERROR]', {
      status: response.status,
      body,
    });

    throw new Error(typeof body === 'string' ? body : body?.message ?? 'Request failed');
  }

  // ------ SKIP JSON (misal DELETE 204) ------
  if (options.skipJson || response.status === 204) {
    return undefined as T;
  }

  // ------ PARSE JSON ------
  try {
    const json = await response.json();
    console.log('[apiFetch] Parsed JSON:', json);
    return json as T;
  } catch (parseError) {
    console.error('[apiFetch] Failed to parse JSON:', parseError);
    throw new Error('Invalid JSON response from API');
  }
}

export function getApiBaseUrl() {
  return baseUrl;
}
