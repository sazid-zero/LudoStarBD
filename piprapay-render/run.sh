#!/bin/bash
set -e

# Render assigns a dynamic port via the $PORT environment variable (usually 10000)
PORT=${PORT:-80}

echo "Configuring Apache to listen on port: $PORT..."
sed -i "s/80/$PORT/g" /etc/apache2/ports.conf
sed -i "s/*:80/*:$PORT/g" /etc/apache2/sites-available/*.conf

# If public folder does not exist, adjust document root to root
if [ ! -d "/var/www/html/public" ]; then
    echo "No public/ directory found, using /var/www/html as DocumentRoot..."
    sed -i "s|/var/www/html/public|/var/www/html|g" /etc/apache2/sites-available/000-default.conf
fi

# Set permissions for storage and cache if Laravel based
if [ -d "/var/www/html/storage" ]; then
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
    chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
fi

echo "Starting Apache Web Server on port $PORT..."
exec apache2-foreground
