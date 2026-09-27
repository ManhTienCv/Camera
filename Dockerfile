# Production Dockerfile for Laravel 11 Backend on Render (PaaS)
FROM php:8.3-fpm-alpine

# Install system dependencies, Nginx, and required C libraries
RUN apk add --no-cache \
    nginx \
    gettext \
    ca-certificates \
    curl \
    git \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        bcmath \
        gd \
        zip \
        intl \
        opcache

# Copy Composer binary from official image
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . .

# Install production PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Setup Nginx configuration template and startup script
RUN mkdir -p /etc/nginx/templates /etc/nginx/conf.d
COPY docker/nginx.conf /etc/nginx/templates/default.conf.template
COPY docker/start.sh /usr/local/bin/start.sh

# Fix permissions and executable flags
RUN dos2unix /usr/local/bin/start.sh 2>/dev/null || true \
    && chmod +x /usr/local/bin/start.sh \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Default Render port
EXPOSE 10000

CMD ["/usr/local/bin/start.sh"]
