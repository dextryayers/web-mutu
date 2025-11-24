<?php
define('DB_HOST', getenv('DB_HOST') ?: 'localhost:5173');
define('DB_NAME', getenv('DB_NAME') ?: 'db_name');
define('DB_USER', getenv('DB_USER') ?: 'db_user');
define('DB_PASS', getenv('DB_PASS') ?: 'db_pass');
define('BASE_URL', getenv('BASE_URL') ?: 'https://domain/api');
