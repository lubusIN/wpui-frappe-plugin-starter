import type { FrappeDataStore } from '@lubusin/wp-frappe-data-store';

type FrappeStoreWindow = Window & {
	wpuiFrappeStore?: FrappeDataStore;
};

const browser = window as FrappeStoreWindow;

if ( ! browser.wpuiFrappeStore ) {
	throw new Error( 'The Frappe data store was not initialized.' );
}

export const frappeStore = browser.wpuiFrappeStore;
