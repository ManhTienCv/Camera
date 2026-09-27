# Production Dockerfile for Laravel 11 Backend on Render (PaaS)
FROM php:8.4-fpm-alpine

# Install system dependencies, Nginx, and tools
RUN apk add --no-cache \
    nginx \
    gettext \
    ca-certificates \
    curl \
    git

# Install PHP extensions using official extension installer for maximum speed & stability
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions \
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

# Install production PHP dependencies (ignoring minor platform mismatch)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --ignore-platform-reqs

# Setup Nginx configuration template and startup script
RUN mkdir -p /etc/nginx/templates /etc/nginx/conf.d
COPY docker/nginx.conf /etc/nginx/templates/nginx.conf.template
COPY docker/start.sh /usr/local/bin/start.sh

# Fix permissions and executable flags
RUN dos2unix /usr/local/bin/start.sh 2>/dev/null || true \
    && chmod +x /usr/local/bin/start.sh \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Default Render port
EXPOSE 10000

CMD ["/usr/local/bin/start.sh"]
