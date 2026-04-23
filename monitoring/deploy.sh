#!/bin/bash
# ==============================================
# genstore-Store Monitoring Stack - Deploy Script
# Oracle Cloud Instance (Ubuntu)
# ==============================================
set -e

echo "=========================================="
echo "  genstore-Store Monitoring Stack Installer"
echo "=========================================="

# 1. Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo ""
    echo "[1/5] Docker no encontrado. Instalando..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "Docker instalado. Si es la primera vez, haz logout/login y ejecuta de nuevo."
else
    echo "[1/5] Docker encontrado: $(docker --version)"
fi

# 2. Check docker compose
if ! docker compose version &> /dev/null; then
    echo "ERROR: docker compose no disponible. Instala docker-compose-plugin."
    exit 1
fi
echo "[2/5] Docker Compose: $(docker compose version --short)"

# 3. Ensure PM2 log directory exists
PM2_LOG_DIR="$HOME/.pm2/logs"
if [ ! -d "$PM2_LOG_DIR" ]; then
    echo "[3/5] Creando directorio de logs PM2..."
    mkdir -p "$PM2_LOG_DIR"
else
    echo "[3/5] Directorio PM2 logs OK: $PM2_LOG_DIR"
fi

# 4. Open firewall port for Grafana (3003)
echo "[4/5] Configurando firewall..."
if command -v iptables &> /dev/null; then
    # Check if rule already exists
    if ! sudo iptables -C INPUT -p tcp --dport 3003 -j ACCEPT 2>/dev/null; then
        sudo iptables -I INPUT 6 -p tcp --dport 3003 -j ACCEPT
        echo "  Puerto 3003 abierto en iptables"
    else
        echo "  Puerto 3003 ya estaba abierto"
    fi
fi

# 5. Launch the stack
echo "[5/5] Iniciando monitoring stack..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

docker compose pull
docker compose up -d

echo ""
echo "=========================================="
echo "  Stack desplegado correctamente!"
echo "=========================================="
echo ""
echo "  Grafana:     http://$(hostname -I | awk '{print $1}'):3003"
echo "  Usuario:     admin"
echo "  Password:    genstore-Store2026!"
echo ""
echo "  Dashboards pre-configurados:"
echo "    - genstore-Store - API & Logs"
echo "    - genstore-Store - System Metrics"
echo ""
echo "  Comandos utiles:"
echo "    docker compose -f $SCRIPT_DIR/docker-compose.yml logs -f    # Ver logs"
echo "    docker compose -f $SCRIPT_DIR/docker-compose.yml restart    # Reiniciar"
echo "    docker compose -f $SCRIPT_DIR/docker-compose.yml down       # Parar todo"
echo ""
