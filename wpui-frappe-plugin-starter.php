<?php
/**
 * Plugin Name: WPUI Frappe Plugin Starter
 * Description: Demonstrates @lubusin/wp-frappe-data-store in a full-page WordPress admin screen using @wordpress/boot and @wordpress/build.
 * Version: 0.1.0
 * Requires at least: 7.0
 * Requires PHP: 7.4
 * Author: LUBUS
 * Author URI: https://lubus.in
 * License: MIT
 * License URI: https://opensource.org/license/mit
 * Text Domain: wpui-frappe-plugin-starter
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WPUI_FRAPPE_VERSION', '0.1.0' );
define( 'WPUI_FRAPPE_FILE', __FILE__ );

$wpui_frappe_build = plugin_dir_path( __FILE__ ) . 'build/build.php';
if ( file_exists( $wpui_frappe_build ) ) {
	require_once $wpui_frappe_build;
} else {
	add_action(
		'admin_notices',
		static function () {
			if ( current_user_can( 'activate_plugins' ) ) {
				echo '<div class="notice notice-error"><p>' . esc_html__( 'WPUI Frappe Plugin Starter is missing its production build. Run npm run build before packaging the plugin.', 'wpui-frappe-plugin-starter' ) . '</p></div>';
			}
		}
	);
}

require_once plugin_dir_path( __FILE__ ) . 'includes/class-rest-proxy.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-plugin.php';

( new WPUI_Frappe_Plugin() )->register();
