#!/usr/bin/env bash
# =============================================================================
# Lumicore — one-time VPS setup
# Run as root (or sudo) on a fresh Ubuntu 22.04 / 24.04 server.
#
# Usage:
#   chmod +x vps-setup.sh
#   sudo ./vps-setup.sh <DOMAIN> <DEPLOY_USER>
#
# Example:
#   sudo ./vps-setup.sh app.lumico.ee deploy
# =============================================================================
set -euo pipefail

DOMAIN="${1:?Usage: $0 <DOMAIN> <DEPLOY_USER>}"
DEPLOY_USER="${2:?Usage: $0 <DOMAIN> <DEPLOY_USER>}"
APP_DIR=/opt/lumicore

# ─── Colour helpers ───────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }

# ─── 1. System deps ───────────────────────────────────────────────────────────
info "Updating system packages"
apt-get update -qq && apt-get upgrade -y -qq

info "Installing Docker"
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable docker
systemctl start docker

info "Installing certbot"
apt-get install -y -qq certbot

# ─── 2. Deploy user ───────────────────────────────────────────────────────────
info "Creating deploy user: $DEPLOY_USER"
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

# Generate an ED25519 key pair for GitHub Actions → VPS SSH
DEPLOY_KEY_DIR="/home/${DEPLOY_USER}/.ssh"
mkdir -p "$DEPLOY_KEY_DIR"
if [[ ! -f "${DEPLOY_KEY_DIR}/id_ed25519" ]]; then
  ssh-keygen -t ed25519 -C "github-actions-deploy" -N "" -f "${DEPLOY_KEY_DIR}/id_ed25519"
fi
cat "${DEPLOY_KEY_DIR}/id_ed25519.pub" >> "${DEPLOY_KEY_DIR}/authorized_keys"
chmod 700 "$DEPLOY_KEY_DIR" && chmod 600 "${DEPLOY_KEY_DIR}/authorized_keys"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$DEPLOY_KEY_DIR"

echo ""
warn "======================================================="
warn "Copy the PRIVATE key below into the VPS_SSH_KEY secret:"
warn "======================================================="
cat "${DEPLOY_KEY_DIR}/id_ed25519"
echo ""

# ─── 3. App directory ─────────────────────────────────────────────────────────
info "Creating app directory: $APP_DIR"
mkdir -p "${APP_DIR}/nginx"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$APP_DIR"

# ─── 4. SSL certificate (standalone — before nginx starts) ───────────────────
info "Obtaining Let's Encrypt certificate for $DOMAIN"
certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email \
  -d "$DOMAIN"

# Auto-renew via systemd timer (certbot installs it automatically on Ubuntu)
info "Enabling certbot auto-renewal"
systemctl enable certbot.timer
systemctl start certbot.timer

# ─── 5. .env template ─────────────────────────────────────────────────────────
ENV_FILE="${APP_DIR}/.env"
if [[ -f "$ENV_FILE" ]]; then
  warn ".env already exists at $ENV_FILE — skipping template generation"
else
  info "Creating .env template at $ENV_FILE"
  cat > "$ENV_FILE" <<EOF
# ── PostgreSQL ────────────────────────────────────────────────────────────────
POSTGRES_USER=lumicore
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=lumico

# ── JWT ───────────────────────────────────────────────────────────────────────
JWT_SECRET=CHANGE_ME_64_RANDOM_CHARS
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=CHANGE_ME_64_RANDOM_CHARS_DIFFERENT
REFRESH_TOKEN_EXPIRES_IN=7d

# ── AWS S3 ────────────────────────────────────────────────────────────────────
AWS_S3_BUCKET=lumico-files
AWS_S3_REGION=eu-north-1
AWS_ACCESS_KEY_ID=CHANGE_ME
AWS_SECRET_ACCESS_KEY=CHANGE_ME

# ── SMTP ──────────────────────────────────────────────────────────────────────
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=CHANGE_ME
SMTP_PASS=CHANGE_ME

# ── SMS ───────────────────────────────────────────────────────────────────────
SMS_PROVIDER_API_KEY=CHANGE_ME

# ── CORS (set to your domain) ─────────────────────────────────────────────────
CORS_ORIGIN=https://${DOMAIN}
SOCKET_CORS_ORIGIN=https://${DOMAIN}
EOF
  chown "${DEPLOY_USER}:${DEPLOY_USER}" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

# ─── 6. Firewall ──────────────────────────────────────────────────────────────
info "Configuring UFW firewall"
if command -v ufw &>/dev/null; then
  ufw allow ssh
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
fi

# ─── 7. Summary ───────────────────────────────────────────────────────────────
echo ""
info "======================================================"
info "VPS setup complete. Before first deploy:"
info "======================================================"
echo ""
echo "  1. Edit ${ENV_FILE} and fill in all CHANGE_ME values"
echo "     (POSTGRES_PASSWORD, JWT_SECRET, AWS keys, SMTP, SMS)"
echo ""
echo "  2. Add these GitHub Actions secrets to your repository:"
echo "       VPS_HOST            → $(hostname -I | awk '{print $1}')"
echo "       VPS_USER            → ${DEPLOY_USER}"
echo "       VPS_SSH_KEY         → (printed above)"
echo "       DOMAIN              → ${DOMAIN}"
echo "       NEXT_PUBLIC_API_URL → https://${DOMAIN}/api/v1"
echo "       NEXT_PUBLIC_WS_URL  → wss://${DOMAIN}"
echo ""
echo "  3. Push a commit to the 'main' branch to trigger deploy."
echo ""
echo "  4. Monitor: docker compose -f /opt/lumicore/docker-compose.prod.yml logs -f"
echo ""
info "SSL cert: /etc/letsencrypt/live/${DOMAIN}/"
info "Auto-renew: systemctl status certbot.timer"
