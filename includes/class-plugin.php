<?php
/**
 * Plugin bootstrap and hook registration.
 *
 * @package WPUI_Frappe_Plugin_Starter
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Coordinates the WordPress-facing parts of the plugin.
 */
final class WPUI_Frappe_Plugin {
	/** Register plugin hooks. */
	public function register() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'frappe-data-store_init', array( $this, 'initialize_application' ) );
		add_action( 'admin_menu', array( $this, 'register_admin_page' ) );
	}

	/** Register the authenticated Frappe proxy. */
	public function register_rest_routes() {
		( new WPUI_Frappe_REST_Proxy() )->register_routes();
	}

	/** Supply runtime settings and server-rendered navigation to Boot. */
	public function initialize_application() {
		$this->enqueue_runtime_settings();

		if ( ! function_exists( 'wp_frappe_data_store_register_frappe_data_store_menu_item' ) ) {
			return;
		}

		$items = array(
			array( 'leads', __( 'Leads', 'wpui-frappe-plugin-starter' ), '/' ),
			array( 'deals', __( 'Deals', 'wpui-frappe-plugin-starter' ), '/deals' ),
			array( 'contacts', __( 'Contacts', 'wpui-frappe-plugin-starter' ), '/contacts' ),
			array( 'organizations', __( 'Organizations', 'wpui-frappe-plugin-starter' ), '/organizations' ),
			array( 'notes', __( 'Notes', 'wpui-frappe-plugin-starter' ), '/notes' ),
			array( 'tasks', __( 'Tasks', 'wpui-frappe-plugin-starter' ), '/tasks' ),
			array( 'settings', __( 'Connection', 'wpui-frappe-plugin-starter' ), '/settings' ),
		);

		foreach ( $items as $item ) {
			wp_frappe_data_store_register_frappe_data_store_menu_item( ...$item );
		}
	}

	/** Register the full-screen admin application. */
	public function register_admin_page() {
		if ( ! function_exists( 'wp_frappe_data_store_frappe_data_store_render_page' ) ) {
			return;
		}

		add_menu_page(
			__( 'Frappe CRM', 'wpui-frappe-plugin-starter' ),
			__( 'Frappe CRM', 'wpui-frappe-plugin-starter' ),
			'manage_options',
			'frappe-data-store',
			'wp_frappe_data_store_frappe_data_store_render_page',
			'dashicons-database',
			30
		);
	}

	/** Make the REST nonce and non-sensitive connection state available early. */
	private function enqueue_runtime_settings() {
		if ( ! wp_script_is( 'wp-api-fetch', 'registered' ) && ! wp_script_is( 'wp-api-fetch', 'enqueued' ) ) {
			return;
		}

		$connection = ( new WPUI_Frappe_REST_Proxy() )->get_connection()->get_data();
		$settings   = array(
			'root'          => esc_url_raw( rest_url() ),
			'nonce'         => wp_create_nonce( 'wp_rest' ),
			'versionString' => 'wp/v2/',
		);

		wp_add_inline_script(
			'wp-api-fetch',
			sprintf(
				'window.wpApiSettings = %1$s; window.wpuiFrappeSettings = %2$s;',
				wp_json_encode( $settings ),
				wp_json_encode( $connection )
			),
			'before'
		);
	}
}
