<?php
if (!defined('WP_UNINSTALL_PLUGIN')) exit;

$options = [
    'gapshop_secret',
    'gapshop_connected',
    'gapshop_tenant_name',
    'gapshop_last_sync',
    'gapshop_do_activation_redirect',
    // legacy options from previous versions
    'gapshop_api_connected',
    'gapshop_settings',
    'gapshop_merchant_id',
];

foreach ($options as $option) {
    delete_option($option);
}

wp_clear_scheduled_hook('gapshop_daily_sync');