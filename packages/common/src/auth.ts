import { __ } from '@wordpress/i18n';

const REST_BASE = '/wp-json/wpui-frappe/v1';
const CONNECTION_TIMEOUT_MS = 20000;

export type FrappeConnection = {
	siteUrl: string;
	hasToken: boolean;
	hasSession: boolean;
	isConfigLocked: boolean;
};

export type ConnectionStatus =
	| 'unknown'
	| 'checking'
	| 'connected'
	| 'disconnected';

type FrappeRuntime = {
	connection: FrappeConnection;
	status: ConnectionStatus;
	validationRequest?: Promise< string >;
};

type FrappeWindow = Window & {
	wpuiFrappeRuntime?: FrappeRuntime;
	wpuiFrappeSettings?: FrappeConnection;
};

function getRuntime(): FrappeRuntime {
	const browser = window as FrappeWindow;
	if ( ! browser.wpuiFrappeRuntime ) {
		const initial = browser.wpuiFrappeSettings ?? {
			siteUrl: '',
			hasToken: false,
			hasSession: false,
			isConfigLocked: false,
		};
		browser.wpuiFrappeRuntime = {
			connection: initial,
			status:
				initial.hasToken || initial.hasSession
					? 'connected'
					: 'disconnected',
		};
	}
	return browser.wpuiFrappeRuntime;
}

export function getConnectionStatus(): ConnectionStatus {
	return getRuntime().status;
}

function resetConnectionStatus(): void {
	const runtime = getRuntime();
	runtime.status = 'unknown';
	runtime.validationRequest = undefined;
}

export function forgetConnectionValidation(): void {
	resetConnectionStatus();
}

export function getWpNonceHeader(): HeadersInit {
	const nonce = (
		window as unknown as { wpApiSettings?: { nonce?: string } }
	 ).wpApiSettings?.nonce;
	return nonce ? { 'X-WP-Nonce': nonce } : {};
}

async function request(
	path: string,
	options: RequestInit = {}
): Promise< Response > {
	const controller = new AbortController();
	// The timer is intentionally created before the request and consumed in
	// `finally` so every completion path clears it.
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const timeout = window.setTimeout(
		() => controller.abort(),
		CONNECTION_TIMEOUT_MS
	);
	try {
		return await fetch( `${ REST_BASE }${ path }`, {
			...options,
			credentials: 'same-origin',
			headers: {
				...getWpNonceHeader(),
				...( options.body
					? { 'Content-Type': 'application/json' }
					: {} ),
				...( options.headers || {} ),
			},
			signal: controller.signal,
		} );
	} catch ( error ) {
		if ( controller.signal.aborted ) {
			throw new Error(
				__(
					'The connection request timed out.',
					'wpui-frappe-plugin-starter'
				)
			);
		}
		throw error;
	} finally {
		window.clearTimeout( timeout );
	}
}

async function responseError( response: Response ): Promise< Error > {
	const body = ( await response.json().catch( () => ( {} ) ) ) as {
		message?: string;
	};
	return new Error(
		body.message ||
			__( 'The request failed.', 'wpui-frappe-plugin-starter' )
	);
}

export function normalizeFrappeSiteUrl( value: string ): string {
	let url: URL;
	try {
		url = new URL( value.trim() );
	} catch {
		throw new Error(
			__(
				'Enter a valid Frappe site URL, including http:// or https://.',
				'wpui-frappe-plugin-starter'
			)
		);
	}
	if ( ! [ 'http:', 'https:' ].includes( url.protocol ) ) {
		throw new Error(
			__(
				'The Frappe site URL must use http:// or https://.',
				'wpui-frappe-plugin-starter'
			)
		);
	}
	if ( url.username || url.password ) {
		throw new Error(
			__(
				'Do not include credentials in the Frappe site URL.',
				'wpui-frappe-plugin-starter'
			)
		);
	}
	if ( url.pathname !== '/' || url.search || url.hash ) {
		throw new Error(
			__(
				'Enter the Frappe site origin without a path, query, or hash.',
				'wpui-frappe-plugin-starter'
			)
		);
	}
	return url.origin;
}

export function getFrappeSiteUrl(): string {
	return getRuntime().connection.siteUrl;
}

export function getFrappeConnection(): FrappeConnection {
	return getRuntime().connection;
}

export async function loadFrappeConnection(): Promise< FrappeConnection > {
	const response = await request( '/connection' );
	if ( ! response.ok ) {
		throw await responseError( response );
	}
	getRuntime().connection = ( await response.json() ) as FrappeConnection;
	resetConnectionStatus();
	return getRuntime().connection;
}

export async function saveFrappeConnection(
	siteUrl: string,
	apiKey: string,
	apiSecret: string
): Promise< FrappeConnection > {
	const response = await request( '/connection', {
		method: 'POST',
		body: JSON.stringify( {
			siteUrl: normalizeFrappeSiteUrl( siteUrl ),
			apiKey: apiKey.trim(),
			apiSecret: apiSecret.trim(),
		} ),
	} );
	if ( ! response.ok ) {
		throw await responseError( response );
	}
	getRuntime().connection = ( await response.json() ) as FrappeConnection;
	resetConnectionStatus();
	return getRuntime().connection;
}

export async function loginWithPassword(
	siteUrl: string,
	username: string,
	password: string,
	isConfigLocked = false
): Promise< FrappeConnection > {
	if ( ! username.trim() || ! password ) {
		throw new Error(
			__(
				'Both username and password are required.',
				'wpui-frappe-plugin-starter'
			)
		);
	}
	if ( ! isConfigLocked ) {
		await saveFrappeConnection( siteUrl, '', '' );
	}
	const response = await request( '/login', {
		method: 'POST',
		body: JSON.stringify( { username: username.trim(), password } ),
	} );
	if ( ! response.ok ) {
		throw await responseError( response );
	}
	getRuntime().connection = ( await response.json() ) as FrappeConnection;
	resetConnectionStatus();
	return getRuntime().connection;
}

export async function logoutPasswordSession(): Promise< FrappeConnection > {
	const response = await request( '/logout', {
		method: 'POST',
	} );
	if ( ! response.ok ) {
		throw await responseError( response );
	}
	getRuntime().connection = ( await response.json() ) as FrappeConnection;
	resetConnectionStatus();
	return getRuntime().connection;
}

export async function clearFrappeConnection(): Promise< void > {
	await logoutPasswordSession();
	const response = await request( '/connection', {
		method: 'POST',
		body: JSON.stringify( {
			siteUrl: getRuntime().connection.siteUrl,
			clearToken: true,
		} ),
	} );
	if ( ! response.ok ) {
		throw await responseError( response );
	}
	getRuntime().connection = ( await response.json() ) as FrappeConnection;
	resetConnectionStatus();
}

function getFrappeMessage( body: Record< string, unknown > ): string {
	if ( typeof body.message === 'string' ) {
		return body.message;
	}
	if ( typeof body.exception === 'string' ) {
		return body.exception;
	}
	return __( 'Frappe rejected the request.', 'wpui-frappe-plugin-starter' );
}

export async function validateFrappeConnection(): Promise< string > {
	const runtime = getRuntime();
	if ( runtime.status === 'connected' ) {
		return __( 'Connected', 'wpui-frappe-plugin-starter' );
	}
	if ( runtime.validationRequest ) {
		return runtime.validationRequest;
	}

	runtime.status = 'checking';
	runtime.validationRequest = ( async () => {
		try {
			if ( ! runtime.connection.siteUrl ) {
				await loadFrappeConnection();
			}
			const response = await request(
				'/proxy/api/method/frappe.auth.get_logged_user'
			);
			const body = ( await response
				.json()
				.catch( () => ( {} ) ) ) as Record< string, unknown >;
			if ( ! response.ok || body.exc_type ) {
				throw new Error( getFrappeMessage( body ) );
			}
			if (
				typeof body.message !== 'string' ||
				body.message === 'Guest'
			) {
				throw new Error(
					__(
						'Connect with a valid Frappe login or API token to continue.',
						'wpui-frappe-plugin-starter'
					)
				);
			}
			runtime.status = 'connected';
			return body.message;
		} catch ( error ) {
			runtime.status = 'disconnected';
			throw error;
		} finally {
			runtime.validationRequest = undefined;
		}
	} )();

	return runtime.validationRequest;
}
