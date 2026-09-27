#!/bin/sh
set -e

# Render exposes PORT variable (defaults to 10000 if not set)
export PORT=${PORT:-10000}

# Remove any conflicting default alpine configs
rm -rf /etc/nginx/http.d/* /etc/nginx/conf.d/* 2>/dev/null || true

# Generate main nginx.conf from template with injected PORT
envsubst '${PORT}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf

echo "==> Configuring Laravel storage and caches..."
php artisan storage:link --force || true

if [ "$AUTO_MIGRATE" = "true" ]; then
    echo "==> Running database migrations..."
    php artisan migrate --force || true

    # Tự động nạp dữ liệu mẫu nếu CSDL mới chưa có người dùng
    USER_COUNT=$(php artisan tinker --execute="echo \App\Models\User::count();" 2>/dev/null || echo "0")
    if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
        echo "==> Fresh database detected (0 users). Seeding default categories, products, vouchers, and admin account..."
        php artisan db:seed --force || true
    fi
fi

if [ "$RUN_SEEDERS" = "true" ]; then
    echo "==> RUN_SEEDERS=true detected. Running database seeders..."
    php artisan db:seed --force || true
fi

if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

echo "==> Starting PHP-FPM on port 9000..."
php-fpm -D

echo "==> Starting Nginx on port $PORT..."
exec nginx -g "daemon off;"
