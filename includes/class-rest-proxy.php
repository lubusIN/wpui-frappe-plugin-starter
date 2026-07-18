<?php
/**
 * Authenticated REST proxy for the configured Frappe site.
 *
 * @package WPUI_Frappe_Plugin_Starter
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Proxies the small Frappe API surface used by the datastore.
 */
final class WPUI_Frappe_REST_Proxy extends WP_REST_Controller {
	const OPTION_SITE_URL = 'wpui_frappe_site_url';
	const OPTION_API_TOKEN = 'wpui_frappe_api_token';
	const USER_META_SESSION = '_wpui_frappe_session';

	/** Set up the controller. */
	public function __construct() {
		$this->namespace = 'wpui-frappe/v1';
		$this->rest_base = 'connection';
	}

	/** Register connection and proxy routes. */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_connection' ),
					'permission_callback' => array( $this, 'check_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_connection' ),
					'permission_callback' => array( $this, 'check_permission' ),
					'args'                => $this->get_connection_args(),
				),
			),
		);

		register_rest_route(
			$this->namespace,
			'/login',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'login' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'username' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'password' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			),
		);

		register_rest_route(
			$this->namespace,
			'/logout',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'logout' ),
				'permission_callback' => array( $this, 'check_permission' ),
			),
		);

		register_rest_route(
			$this->namespace,
			'/proxy/(?P<path>api/(?:resource(?:/.*)?|method/frappe\.auth\.get_logged_user))',
			array(
				'methods'             => array( 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' ),
				'callback'            => array( $this, 'proxy_request' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'path' => array(
						// Do not use sanitize_text_field(): it removes encoded octets,
						// turning DocTypes such as "CRM%20Deal" into "CRMDeal".
						// The route regex above is the path allowlist.
						'type'     => 'string',
						'required' => true,
					),
				),
			),
		);
	}

	/** @return bool Whether the current user may administer the connection. */
	public function check_permission() {
		return current_user_can( 'manage_options' );
	}

	/** @return array REST argument definitions. */
	private function get_connection_args() {
		return array(
			'siteUrl'   => array(
				'type'              => 'string',
				'required'          => true,
				'sanitize_callback' => 'esc_url_raw',
				'validate_callback' => array( $this, 'validate_site_url' ),
			),
			'apiKey'    => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'apiSecret' => array(
				// Secrets are opaque values. Trimming occurs when the token is
				// assembled; text sanitization could alter a valid credential.
				'type' => 'string',
			),
			'clearToken' => array(
				'type'    => 'boolean',
				'default' => false,
			),
		);
	}

	/**
	 * Validate an origin-only HTTP(S) URL.
	 *
	 * Private/local hosts are accepted only when WPUI_FRAPPE_ALLOW_LOCAL is true.
	 *
	 * @param string $value Candidate URL.
	 * @return bool
	 */
	public function validate_site_url( $value ) {
		$url = wp_parse_url( $value );
		if ( ! is_array( $url ) || empty( $url['scheme'] ) || empty( $url['host'] ) ) {
			return false;
		}
		if ( ! in_array( strtolower( $url['scheme'] ), array( 'http', 'https' ), true ) ) {
			return false;
		}
		if ( isset( $url['user'] ) || isset( $url['pass'] ) || isset( $url['query'] ) || isset( $url['fragment'] ) ) {
			return false;
		}
		if ( isset( $url['path'] ) && '/' !== $url['path'] && '' !== $url['path'] ) {
			return false;
		}

		$allow_local = defined( 'WPUI_FRAPPE_ALLOW_LOCAL' ) && true === WPUI_FRAPPE_ALLOW_LOCAL;
		return $allow_local || false !== wp_http_validate_url( $value );
	}

	/** @return string Configured upstream origin. */
	private function get_site_url() {
		if ( defined( 'WPUI_FRAPPE_SITE_URL' ) ) {
			return untrailingslashit( WPUI_FRAPPE_SITE_URL );
		}
		return untrailingslashit( (string) get_option( self::OPTION_SITE_URL, '' ) );
	}

	/** @return string Configured Frappe token without the auth scheme. */
	private function get_api_token() {
		if ( defined( 'WPUI_FRAPPE_API_TOKEN' ) ) {
			return preg_replace( '/^token\s+/i', '', trim( WPUI_FRAPPE_API_TOKEN ) );
		}
		return (string) get_option( self::OPTION_API_TOKEN, '' );
	}

	/** @return array Stored cookies for the current WordPress user. */
	private function get_session_cookies() {
		$cookies = get_user_meta( get_current_user_id(), self::USER_META_SESSION, true );
		if ( ! is_array( $cookies ) ) {
			return array();
		}
		return array_values(
			array_filter(
				array_map(
					static function ( $cookie ) {
						if ( ! is_array( $cookie ) || empty( $cookie['name'] ) || ! isset( $cookie['value'] ) || ( ! empty( $cookie['expires'] ) && (int) $cookie['expires'] <= time() ) ) {
							return null;
						}
						return new WP_Http_Cookie(
							array(
								'name'    => sanitize_key( $cookie['name'] ),
								'value'   => (string) $cookie['value'],
								'expires' => isset( $cookie['expires'] ) ? (int) $cookie['expires'] : null,
							)
						);
					},
					$cookies
				)
			)
		);
	}

	/** @return WP_REST_Response Safe connection metadata. */
	public function get_connection() {
		return rest_ensure_response(
			array(
				'siteUrl'       => $this->get_site_url(),
				'hasToken'      => '' !== $this->get_api_token(),
				'hasSession'    => ! empty( $this->get_session_cookies() ),
				'isConfigLocked' => defined( 'WPUI_FRAPPE_SITE_URL' ) || defined( 'WPUI_FRAPPE_API_TOKEN' ),
			)
		);
	}

	/**
	 * Save connection settings. Constants always take precedence over options.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_connection( $request ) {
		if ( defined( 'WPUI_FRAPPE_SITE_URL' ) || defined( 'WPUI_FRAPPE_API_TOKEN' ) ) {
			return new WP_Error( 'wpui_frappe_locked', __( 'The Frappe connection is managed in wp-config.php.', 'wpui-frappe-plugin-starter' ), array( 'status' => 409 ) );
		}

		$api_key    = trim( (string) $request->get_param( 'apiKey' ) );
		$api_secret = trim( (string) $request->get_param( 'apiSecret' ) );
		if ( ( '' === $api_key ) !== ( '' === $api_secret ) ) {
			return new WP_Error( 'wpui_frappe_incomplete_token', __( 'Both API key and API secret are required.', 'wpui-frappe-plugin-starter' ), array( 'status' => 400 ) );
		}

		update_option( self::OPTION_SITE_URL, untrailingslashit( $request->get_param( 'siteUrl' ) ), false );
		if ( $request->get_param( 'clearToken' ) ) {
			delete_option( self::OPTION_API_TOKEN );
		} elseif ( '' !== $api_key ) {
			update_option( self::OPTION_API_TOKEN, $api_key . ':' . $api_secret, false );
		}

		return $this->get_connection();
	}

	/**
	 * Exchange Frappe credentials for a server-side session.
	 *
	 * The password is used for this request only and is never persisted.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function login( $request ) {
		$site_url = $this->get_site_url();
		if ( '' === $site_url || ! $this->validate_site_url( $site_url ) ) {
			return new WP_Error( 'wpui_frappe_not_configured', __( 'Save a valid Frappe site URL first.', 'wpui-frappe-plugin-starter' ), array( 'status' => 503 ) );
		}

		$args = array(
			'headers'     => array( 'Content-Type' => 'application/x-www-form-urlencoded' ),
			'body'        => array(
				'usr' => (string) $request->get_param( 'username' ),
				'pwd' => (string) $request->get_param( 'password' ),
			),
			'timeout'     => 20,
			'redirection' => 0,
			'sslverify'   => ! ( defined( 'WPUI_FRAPPE_ALLOW_INSECURE_TLS' ) && true === WPUI_FRAPPE_ALLOW_INSECURE_TLS ),
		);
		$allow_local = defined( 'WPUI_FRAPPE_ALLOW_LOCAL' ) && true === WPUI_FRAPPE_ALLOW_LOCAL;
		$response    = $allow_local ? wp_remote_post( $site_url . '/api/method/login', $args ) : wp_safe_remote_post( $site_url . '/api/method/login', $args );
		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'wpui_frappe_unavailable', __( 'WordPress could not reach the configured Frappe site.', 'wpui-frappe-plugin-starter' ), array( 'status' => 502 ) );
		}

		$status = wp_remote_retrieve_response_code( $response );
		$data   = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( $status < 200 || $status >= 300 || ! is_array( $data ) || isset( $data['exc_type'] ) ) {
			return new WP_Error( 'wpui_frappe_login_failed', __( 'Frappe rejected the username or password.', 'wpui-frappe-plugin-starter' ), array( 'status' => 401 ) );
		}

		$stored = array();
		foreach ( wp_remote_retrieve_cookies( $response ) as $cookie ) {
			$stored[] = array(
				'name'    => $cookie->name,
				'value'   => $cookie->value,
				'expires' => $cookie->expires,
			);
		}
		if ( empty( $stored ) ) {
			return new WP_Error( 'wpui_frappe_session_missing', __( 'Frappe did not return a login session.', 'wpui-frappe-plugin-starter' ), array( 'status' => 502 ) );
		}

		update_user_meta( get_current_user_id(), self::USER_META_SESSION, $stored );
		return $this->get_connection();
	}

	/** @return WP_REST_Response Clear the current user's server-side session. */
	public function logout() {
		delete_user_meta( get_current_user_id(), self::USER_META_SESSION );
		return $this->get_connection();
	}

	/**
	 * Relay an authenticated request to the fixed upstream site.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function proxy_request( $request ) {
		$site_url = $this->get_site_url();
		$token    = $this->get_api_token();
		$cookies  = $this->get_session_cookies();
		if ( '' === $site_url || ( '' === $token && empty( $cookies ) ) || ! $this->validate_site_url( $site_url ) ) {
			return new WP_Error( 'wpui_frappe_not_configured', __( 'Connect with a Frappe login or API token first.', 'wpui-frappe-plugin-starter' ), array( 'status' => 503 ) );
		}

		$url = $site_url . '/' . ltrim( $request['path'], '/' );
		$query = $request->get_query_params();
		unset( $query['rest_route'] );
		if ( $query ) {
			$url = add_query_arg( $query, $url );
		}

		$args = array(
			'method'      => $request->get_method(),
			'headers'     => array(
				'Accept'       => 'application/json',
				'Content-Type' => 'application/json',
			),
			'cookies'     => $cookies,
			'timeout'     => 20,
			'redirection' => 0,
			'sslverify'   => ! ( defined( 'WPUI_FRAPPE_ALLOW_INSECURE_TLS' ) && true === WPUI_FRAPPE_ALLOW_INSECURE_TLS ),
		);
		if ( '' !== $token && empty( $cookies ) ) {
			$args['headers']['Authorization'] = 'token ' . $token;
		}
		if ( in_array( $request->get_method(), array( 'POST', 'PUT', 'PATCH', 'DELETE' ), true ) ) {
			$args['body'] = $request->get_body();
		}

		$allow_local = defined( 'WPUI_FRAPPE_ALLOW_LOCAL' ) && true === WPUI_FRAPPE_ALLOW_LOCAL;
		$response    = $allow_local ? wp_remote_request( $url, $args ) : wp_safe_remote_request( $url, $args );
		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'wpui_frappe_unavailable', __( 'WordPress could not reach the configured Frappe site.', 'wpui-frappe-plugin-starter' ), array( 'status' => 502 ) );
		}

		$status = wp_remote_retrieve_response_code( $response );
		$body   = wp_remote_retrieve_body( $response );
		$data   = json_decode( $body, true );
		if ( JSON_ERROR_NONE !== json_last_error() ) {
			$data = array( 'message' => __( 'Frappe returned an invalid JSON response.', 'wpui-frappe-plugin-starter' ) );
		}

		return new WP_REST_Response( $data, $status );
	}
}
