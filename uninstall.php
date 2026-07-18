<?php
/**
 * Remove connection data created by the plugin.
 *
 * @package WPUI_Frappe_Plugin_Starter
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'wpui_frappe_site_url' );
delete_option( 'wpui_frappe_api_token' );

delete_site_option( 'wpui_frappe_site_url' );
delete_site_option( 'wpui_frappe_api_token' );

global $wpdb;
$wpdb->delete( $wpdb->usermeta, array( 'meta_key' => '_wpui_frappe_session' ) );
