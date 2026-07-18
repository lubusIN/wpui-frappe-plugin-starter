const REST_BASE = '/wp-json/wpui-frappe/v1';
const CONNECTION_TIMEOUT_MS = 20000;

export type FrappeConnection = {
	siteUrl: string;
	hasToken: boolean;
	hasSession: boolean;
	isConfigLocked: boolean;
};

let connection: FrappeConnection = {
	siteUrl: '',
	hasToken: false,
	hasSession: false,
	isConfigLocked: false,
};

export function getWpNonceHeader(): HeadersInit {
	const nonce = (
		window as unknown as { wpApiSettings?: { nonce?: string } }
	).wpApiSettings?.nonce;
	return nonce ? { 'X-WP-Nonce': nonce } : {};
}

async function request(
	path: string,
	options: RequestInit = {}
): Promise<Response> {
	const controller = new AbortController();
	const timeout = window.setTimeout(
		() => controller.abort(),
		CONNECTION_TIMEOUT_MS
	);
	try {
		return await fetch(`${REST_BASE}${path}`, {
			...options,
			credentials: 'same-origin',
			headers: {
				...getWpNonceHeader(),
				...(options.body ? { 'Content-Type': 'application/json' } : {}),
				...(options.headers || {}),
			},
			signal: controller.signal,
		});
	} catch (error) {
		if (controller.signal.aborted) {
			throw new Error('The connection request timed out.');
		}
		throw error;
	} finally {
		window.clearTimeout(timeout);
	}
}

async function responseError(response: Response): Promise<Error> {
	const body = (await response.json().catch(() => ({}))) as {
		message?: string;
	};
	return new Error(body.message || `The request failed (${response.status}).`);
}

export function normalizeFrappeSiteUrl(value: string): string {
	let url: URL;
	try {
		url = new URL(value.trim());
	} catch {
		throw new Error(
			'Enter a valid Frappe site URL, including http:// or https://.'
		);
	}
	if (!['http:', 'https:'].includes(url.protocol)) {
		throw new Error('The Frappe site URL must use http:// or https://.');
	}
	if (url.username || url.password) {
		throw new Error('Do not include credentials in the Frappe site URL.');
	}
	if (url.pathname !== '/' || url.search || url.hash) {
		throw new Error('Enter the Frappe site origin without a path, query, or hash.');
	}
	return url.origin;
}

export function getFrappeSiteUrl(): string {
	return connection.siteUrl;
}

export async function loadFrappeConnection(): Promise<FrappeConnection> {
	const response = await request('/connection');
	if (!response.ok) throw await responseError(response);
	connection = (await response.json()) as FrappeConnection;
	return connection;
}

export async function saveFrappeConnection(
	siteUrl: string,
	apiKey: string,
	apiSecret: string
): Promise<FrappeConnection> {
	const response = await request('/connection', {
		method: 'POST',
		body: JSON.stringify({
			siteUrl: normalizeFrappeSiteUrl(siteUrl),
			apiKey: apiKey.trim(),
			apiSecret: apiSecret.trim(),
		}),
	});
	if (!response.ok) throw await responseError(response);
	connection = (await response.json()) as FrappeConnection;
	return connection;
}

export async function loginWithPassword(
	siteUrl: string,
	username: string,
	password: string,
	isConfigLocked = false
): Promise<FrappeConnection> {
	if (!username.trim() || !password) {
		throw new Error('Both username and password are required.');
	}
	if (!isConfigLocked) {
		await saveFrappeConnection(siteUrl, '', '');
	}
	const response = await request('/login', {
		method: 'POST',
		body: JSON.stringify({ username: username.trim(), password }),
	});
	if (!response.ok) throw await responseError(response);
	connection = (await response.json()) as FrappeConnection;
	return connection;
}

export async function logoutPasswordSession(): Promise<FrappeConnection> {
	const response = await request('/logout', {
		method: 'POST',
	});
	if (!response.ok) throw await responseError(response);
	connection = (await response.json()) as FrappeConnection;
	return connection;
}

export async function clearFrappeConnection(): Promise<void> {
	await logoutPasswordSession();
	const response = await request('/connection', {
		method: 'POST',
		body: JSON.stringify({
			siteUrl: connection.siteUrl,
			clearToken: true,
		}),
	});
	if (!response.ok) throw await responseError(response);
	connection = (await response.json()) as FrappeConnection;
}

function getFrappeMessage(body: Record<string, unknown>): string {
	if (typeof body.message === 'string') return body.message;
	if (typeof body.exception === 'string') return body.exception;
	return 'Frappe rejected the request.';
}

export async function validateFrappeConnection(): Promise<string> {
	if (!connection.siteUrl) await loadFrappeConnection();
	const response = await request(
		'/proxy/api/method/frappe.auth.get_logged_user'
	);
	const body = (await response.json().catch(() => ({}))) as Record<
		string,
		unknown
	>;
	if (!response.ok || body.exc_type) throw new Error(getFrappeMessage(body));
	if (typeof body.message !== 'string' || body.message === 'Guest') {
		throw new Error('Connect with a valid Frappe login or API token to continue.');
	}
	return body.message;
}
