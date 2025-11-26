<?php
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'DB_NAME');
define('DB_USER', getenv('DB_USER') ?: 'DB_USER');
define('DB_PASS', getenv('DB_PASS') ?: 'DB_PASS');
define('BASE_URL', getenv('BASE_URL') ?: 'https://DOMAIN/api');
define('ADMIN_SECRET_CODE', 'ADMIN_CODE');
