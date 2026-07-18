=== WPUI Frappe Plugin Starter ===
Contributors: lubus
Tags: frappe, crm, dataviews, admin
Requires at least: 7.0
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.1.0
License: MIT
License URI: https://opensource.org/license/mit

A production-oriented starter for a Frappe-backed WordPress admin application.

== Description ==

Demonstrates @wordpress/build, @wordpress/boot, DataViews, and a locked-down
server-side proxy for @lubusin/wp-frappe-data-store.

WordPress 7.0 or a compatible Gutenberg plugin is required because the current
@wordpress/build runtime consumes @wordpress/boot from WordPress Core.

For production, define WPUI_FRAPPE_SITE_URL and WPUI_FRAPPE_API_TOKEN in
wp-config.php. Administrators can alternatively connect through the UI using a
Frappe login or API key and secret.

== Installation ==

1. Upload and activate the plugin.
2. Define the Frappe constants in wp-config.php or open Frappe CRM in wp-admin.
3. Use a dedicated, least-privilege Frappe API user.

== Changelog ==

= 0.1.0 =
* Initial starter release.
