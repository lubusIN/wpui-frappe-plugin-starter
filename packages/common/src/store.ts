import { registerFrappeDataStore } from '@lubusin/wp-frappe-data-store';
import { getWpNonceHeader } from './auth';

export const frappeStore = registerFrappeDataStore( {
	storeName: 'frappe-sample-plugin/resources',
	baseUrl: '/wp-json/wpui-frappe/v1/proxy',
	apiPath: '/api/resource',
	credentials: 'same-origin',
	headers: () => ( {
		...getWpNonceHeader(),
	} ),
} );
