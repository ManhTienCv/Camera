<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'momo' => [
        'endpoint' => env('MOMO_ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/create'),
        'partner_code' => env('MOMO_PARTNER_CODE', 'MOMOBKUN20180529'),
        'access_key' => env('MOMO_ACCESS_KEY', 'klm05TvNBzhg7h7j'),
        'secret_key' => env('MOMO_SECRET_KEY', 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa'),
        'request_type' => env('MOMO_REQUEST_TYPE', 'payWithMethod'),
        'verify_ssl' => env('MOMO_VERIFY_SSL', false),
        'redirect_url' => env('MOMO_REDIRECT_URL', 'http://127.0.0.1:8000/payment/momo/callback'),
        'ipn_url' => env('MOMO_IPN_URL', 'http://127.0.0.1:8000/api/v1/payment/momo/ipn'),
    ],

    'ghn' => [
        'api_url' => env('GHN_API_URL', 'https://online-gateway.ghn.vn/shiip/public-api/v2'),
        'api_token' => env('GHN_API_TOKEN', '5a8e6646-a763-11f1-be93-ea52ad3d88b7'),
        'shop_id' => (int) env('GHN_SHOP_ID', 6643423),
        'from_district_id' => (int) env('GHN_SENDER_DISTRICT_ID', 1482),
        'from_ward_code' => env('GHN_SENDER_WARD_CODE', '11008'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', env('APP_URL', 'http://localhost:8000') . '/api/v1/auth/google/callback'),
    ],

];
