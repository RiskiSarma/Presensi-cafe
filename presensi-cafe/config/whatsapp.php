<?php

// Pengiriman WhatsApp lewat Fonnte (https://fonnte.com). Kosongkan FONNTE_TOKEN untuk mematikan fitur ini.
return [
    'token' => env('FONNTE_TOKEN'),
    'endpoint' => env('FONNTE_ENDPOINT', 'https://api.fonnte.com/send'),
];
