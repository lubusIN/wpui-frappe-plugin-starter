import './router-compat';
import './shell.scss';
import { dispatch } from '@wordpress/data';
import {
	registerFrappeDataStore,
	type FrappeDataStore,
} from '@lubusin/wp-frappe-data-store';
import { store as bootStore } from '@wordpress/boot';
import { __ } from '@wordpress/i18n';
import {
	people,
	currencyDollar,
	postAuthor,
	store,
	pencil,
	check,
	settings,
} from '@wordpress/icons';

declare global {
	interface Window {
		wpuiFrappeStore?: FrappeDataStore;
		wpApiSettings?: { nonce?: string };
	}
}

function registerStore() {
	if ( window.wpuiFrappeStore ) {
		return;
	}

	window.wpuiFrappeStore = registerFrappeDataStore( {
		storeName: 'wpui-frappe/resources',
		baseUrl: '/wp-json/wpui-frappe/v1/proxy',
		apiPath: '/api/resource',
		credentials: 'same-origin',
		headers: (): HeadersInit => {
			const nonce = window.wpApiSettings?.nonce;
			return nonce ? { 'X-WP-Nonce': nonce } : {};
		},
	} );
}

/**
 * Initialize page - this function is mandatory.
 * All init modules must export an 'init' function.
 */
export async function init() {
	registerStore();

	dispatch( bootStore ).registerMenuItem( 'leads', {
		id: 'leads',
		label: __( 'Leads', 'wpui-frappe-plugin-starter' ),
		to: '/',
		icon: people,
	} );
	dispatch( bootStore ).registerMenuItem( 'deals', {
		id: 'deals',
		label: __( 'Deals', 'wpui-frappe-plugin-starter' ),
		to: '/deals',
		icon: currencyDollar,
	} );
	dispatch( bootStore ).registerMenuItem( 'contacts', {
		id: 'contacts',
		label: __( 'Contacts', 'wpui-frappe-plugin-starter' ),
		to: '/contacts',
		icon: postAuthor,
	} );
	dispatch( bootStore ).registerMenuItem( 'organizations', {
		id: 'organizations',
		label: __( 'Organizations', 'wpui-frappe-plugin-starter' ),
		to: '/organizations',
		icon: store,
	} );
	dispatch( bootStore ).registerMenuItem( 'notes', {
		id: 'notes',
		label: __( 'Notes', 'wpui-frappe-plugin-starter' ),
		to: '/notes',
		icon: pencil,
	} );
	dispatch( bootStore ).registerMenuItem( 'tasks', {
		id: 'tasks',
		label: __( 'Tasks', 'wpui-frappe-plugin-starter' ),
		to: '/tasks',
		icon: check,
	} );
	dispatch( bootStore ).registerMenuItem( 'settings', {
		id: 'settings',
		label: __( 'Settings', 'wpui-frappe-plugin-starter' ),
		to: '/settings',
		icon: settings,
	} );
}
