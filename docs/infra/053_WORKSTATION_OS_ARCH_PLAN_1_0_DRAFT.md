---
id: 053
area: infrastructure
type: PLAN
module: workstation
version: 1.0
status: DRAFT
author: workflow-agent
created: 2026-06-04
last_updated: 2026-06-04
dependencies:
  - algoritmos/ALGP005_WORKFLOW_OS_ARCH_v1_0_DRAFT.md
  - workflow/032_DEV_SPEC_PROMPT_COMPILER_WORKFLOW_1_0_DRAFT.md
  - workflow/035_EXEC_PLAN_PROMPT_OS_1_0_DRAFT.md
tags:
  - arch-linux
  - lenovo
  - workstation
  - server
  - prompt-os
  - development-environment
  - self-hosted
summary: "Analisis de viabilidad y plan de implementacion para convertir una laptop Lenovo en un servidor/estacion de trabajo con Arch Linux minimal, capable de funcionar como servidor de aplicaciones y entorno de desarrollo interactivo."
keywords:
  - arch-linux
  - lenovo
  - thinkpad
  - workstation
  - server
  - self-hosted
  - development
  - i3
  - docker
  - postgresql
  - prompt-os
  - workflow.sh
changelog:
  - version: 1.0
    date: 2026-06-04
    author: workflow-agent
    description: "Creacion del analisis de viabilidad y plan de implementacion para Workstation OS sobre Arch Linux en laptop Lenovo"
---

# Workstation OS — Laptop Lenovo como Servidor y Entorno de Desarrollo

## 0. Resumen Ejecutivo

**Sí, es viable.** Instalar Arch Linux en una laptop Lenovo (especialmente una ThinkPad) para usarla simultáneamente como **servidor de aplicaciones** y **entorno de desarrollo interactivo** no solo es posible, sino que es un caso de uso clásico en la comunidad de Arch.

Este documento analiza la viabilidad técnica, propone una arquitectura que integra los conceptos existentes del proyecto (Prompt OS, workflow.sh, bot Python, microservicios) y presenta un plan de implementación por fases.

---

## 1. Análisis de Viabilidad

### 1.1 Hardware — Laptop Lenovo

Las laptops Lenovo, especialmente la línea **ThinkPad**, tienen un soporte excepcional en Arch Linux:

| Componente | Soporte en Arch | Notas |
|---|---|---|
| **CPU** (Intel/AMD) | Excelente | Linux soporta todas las generaciones recientes |
| **GPU** (Intel/AMD/NVIDIA) | Bueno | Intel integrada funciona out-of-the-box |
| **WiFi** (Intel) | Excelente | Intel AX200/AX210 con driver `iwlwifi` incluido |
| **Audio** | Bueno | snd-hda-intel o snd-sob-topology |
| **Trackpoint** | Excelente | `xf86-input-libinput` lo maneja directamente |
| **Teclado retroiluminado** | Bueno | Depende del modelo, `thinkpad_acpi` module |
| **Suspender/hibernar** | Bueno | S3 sleep funciona en la mayoría de ThinkPads |
| **Thunderbolt/USB-C** | Bueno | `bolt` service para gestión |
| **Batería** | Excelente | `tlp` o `power-profiles-daemon` para gestión |

**Recomendación de laptop**: ThinkPad T/X/P series (T480, X1 Carbon, P53, etc.) — tienen el mejor soporte de Linux, piezas reemplazables, y se consiguen fácilmente usadas.

### 1.2 Sistema Operativo — Arch Linux Minimal

Arch Linux es ideal por:

- **Minimalismo**: Instalas solo lo que necesitas. Sin bloatware.
- **Rolling release**: Software siempre actualizado. Ideal para desarrollo.
- **AUR**: Acceso a prácticamente cualquier software.
- **Documentación**: Arch Wiki es la mejor fuente de documentación Linux.
- **Systemd**: Init system moderno para gestionar servicios.
- **pacman**: Gestor de paquetes rápido y simple.

### 1.3 Dual rol: Servidor + Desktop

El desafío es que una laptop sirva como:

1. **Servidor** (24/7): Base de datos, API, bot, CI/CD, Git
2. **Estación de trabajo** (interactivo): Navegador, editor, terminal, chat

Esto no es contradictorio, pero requiere una arquitectura clara:

| Rol | Componentes | Modo de uso |
|---|---|---|
| **Servidor** | PostgreSQL, Redis, Docker, API NestJS, bot Python | Daemons systemd, headless |
| **Desktop** | i3wm/sway, Firefox/Chromium, Neovim/VSCode, terminal | Interactivo, sesión gráfica |
| **Prompt OS** | workflow.sh, ~/.workflow/, bot asistente | Capa de orquestación |

---

## 2. Arquitectura Propuesta

### 2.1 Diagrama de capas

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERACCIÓN DEL USUARIO                        │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ TTY (tty)│  │ WINDOW   │  │ BROWSER  │  │ PROMPT OS CLI   │ │
│  │ consola  │  │ MANAGER  │  │(Firefox) │  │ workflow.sh bot  │ │
│  └────┬─────┘  │ (i3/sway)│  └────┬─────┘  └────────┬─────────┘ │
│       │        └────┬─────┘       │                  │           │
│       └─────────────┼─────────────┼──────────────────┘           │
│                     │             │                              │
├─────────────────────┴─────────────┴──────────────────────────────┤
│                  PROMPT OS (workflow.sh)                          │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────────┐     │
│  │ dev      │  │ system   │  │  bot / AI                  │     │
│  │ analyze  │  │ pkg      │  │  chat asistente            │     │
│  │ propose  │  │ daemon   │  │  clasificador intents      │     │
│  │ plan     │  │ net      │  │  conexión a servicios      │     │
│  │ execute  │  │ config   │  └────────────────────────────┘     │
│  │ verify   │  │ backup   │                                      │
│  └──────────┘  └──────────┘                                      │
├──────────────────────────────────────────────────────────────────┤
│                     SERVIDOR (Daemons systemd)                     │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │PostgreSQL│  │  Redis   │  │  Docker  │  │ API NestJS       │ │
│  │ (5432)   │  │ (6379)   │  │         │  │ (puerto 3000)    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│                                                                   │
│  ┌──────────┐  ┌───────────────────────────────────────────┐     │
│  │ Bot Py   │  │ Nginx / Caddy (proxy reverso, TLS local) │     │
│  │ (:8000)  │  │                                           │     │
│  └──────────┘  └───────────────────────────────────────────┘     │
├──────────────────────────────────────────────────────────────────┤
│                     ARCH LINUX                                    │
│                                                                   │
│  ┌──────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │pacman│ │systemd │ │NetworkMgr│ │ Linux    │ │ Filesystem │  │
│  │ yay  │ │timers  │ │bluez     │ │ Kernel   │ │ (btrfs)    │  │
│  └──────┘ └────────┘ └──────────┘ └──────────┘ └────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 ¿Qué es "Prompt OS" y cómo se integra?

**Prompt OS** (definido en `ALGP005_WORKFLOW_OS_ARCH_v1_0_DRAFT.md`) es una **capa de abstracción** donde `workflow.sh` actúa como el kernel/orquestador del sistema. No es un sistema operativo real — es una filosofía donde:

- **Everything is a file**: Estado, configuración y resultados son archivos en `~/.workflow/`
- **Everything is a prompt**: Toda instrucción se expresa como lenguaje natural
- **workflow.sh como kernel**: Orquesta pacman, systemd, Docker, git, etc. mediante wrappers unificados

En la laptop Lenovo, Prompt OS se convierte en la **interfaz unificada** para:
- Gestionar servicios del servidor (iniciar/parar PostgreSQL, Redis, API)
- Desarrollar (ciclo analyze → propose → plan → execute → verify)
- Administrar el sistema (paquetes, red, respaldos)
- Interactuar con el bot asistente

### 2.3 Flujo de uso diario

```
Mañana:
  workflow.sh daemon status          # Verificar que todo corre
  workflow.sh container ps           # Ver contenedores activos
  workflow.sh dev analyze            # Escanear código, obtener contexto
  
Durante el día:
  workflow.sh full "Agrega un endpoint..."   # Ciclo completo de desarrollo
  workflow.sh bot "hay stock de X?"          # Consultar al bot asistente
  workflow.sh pkg install <algo>             # Instalar paquete
  workflow.sh net wifi connect <ssid>        # Conectar WiFi
  workflow.sh monitor all                    # Ver estado del sistema

Tarde/Noche:
  workflow.sh backup create daily            # Backup automático
  workflow.sh git push                       # Push con changelog check
```

---

## 3. Plan de Implementación por Fases

### Fase 1 — Instalación de Arch Linux

**Objetivo**: Sistema base funcional con boot, red y SSH.

#### 1.1 Preparación

```bash
# Descargar ISO
wget https://archlinux.org/releng/releases/2026.06.01/torrent/archlinux-2026.06.01-x86_64.iso.torrent

# Crear USB booteable
dd bs=4M if=archlinux.iso of=/dev/sdX conv=fsync oflag=direct status=progress
```

#### 1.2 Instalación base

Seguir la [guía oficial de instalación](https://wiki.archlinux.org/title/Installation_guide):

```bash
# Particionado (ejemplo con btrfs + LUKS)
parted /dev/nvme0n1 mklabel gpt
parted /dev/nvme0n1 mkpart primary 1MiB 513MiB    # EFI
parted /dev/nvme0n1 mkpart primary 513MiB 100%     # LUKS

# Cifrado LUKS
cryptsetup luksFormat /dev/nvme0n1p2
cryptsetup open /dev/nvme0n1p2 cryptroot

# btrfs con subvolumes
mkfs.btrfs -L root /dev/mapper/cryptroot
mount /dev/mapper/cryptroot /mnt

btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@home
btrfs subvolume create /mnt/@snapshots
btrfs subvolume create /mnt/@docker
btrfs subvolume create /mnt/@workflow

umount /mnt

# Montar subvolumes
mount -o subvol=@,compress=zstd /dev/mapper/cryptroot /mnt
mkdir -p /mnt/{home,.snapshots,var/lib/docker,home/john/.workflow}
mount -o subvol=@home,compress=zstd /dev/mapper/cryptroot /mnt/home
mount -o subvol=@snapshots,compress=zstd /dev/mapper/cryptroot /mnt/.snapshots
mount -o subvol=@docker,compress=zstd /dev/mapper/cryptroot /mnt/var/lib/docker
mount -o subvol=@workflow,compress=zstd /dev/mapper/cryptroot /mnt/home/john/.workflow

# EFI
mkfs.fat -F 32 /dev/nvme0n1p1
mount /dev/nvme0n1p1 /mnt/boot

# Instalar base
pacstrap -K /mnt base base-devel linux linux-firmware btrfs-progs
genfstab -L /mnt >> /mnt/etc/fstab
arch-chroot /mnt
```

#### 1.3 Configuración post-instalación

```bash
# Dentro del chroot
ln -sf /usr/share/zoneinfo/Europe/Madrid /etc/localtime
hwclock --systohc

# Localización
echo "es_ES.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen
echo "LANG=es_ES.UTF-8" > /etc/locale.conf

# Hostname
echo "prompt-os" > /etc/hostname

# Usuario
useradd -m -G wheel,docker john
passwd john

# Sudo
echo "%wheel ALL=(ALL:ALL) ALL" >> /etc/sudoers.d/wheel

# Bootloader (systemd-boot para UEFI)
bootctl install
echo "default arch.conf" > /boot/loader/loader.conf

cat > /boot/loader/entries/arch.conf << 'EOF'
title   Arch Linux (Prompt OS)
linux   /vmlinuz-linux
initrd  /intel-ucode.img
initrd  /initramfs-linux.img
options cryptdevice=UUID=$(blkid -s UUID -o value /dev/nvme0n1p2):cryptroot root=/dev/mapper/cryptroot rootflags=subvol=@ rw quiet
EOF

# mkinitcpio con encrypt hook
sed -i 's/HOOKS=(base udev ... block filesystems)/HOOKS=(base udev autodetect modconf block encrypt btrfs filesystems)/' /etc/mkinitcpio.conf
mkinitcpio -P

# Salir y reiniciar
exit
umount -R /mnt
reboot
```

#### 1.4 Checklist de verificación

- [ ] Sistema arranca con LUKS + btrfs
- [ ] Red funciona (NetworkManager)
- [ ] SSH funciona (`sudo systemctl enable --now sshd`)
- [ ] Usuario creado con sudo
- [ ] Se puede acceder desde otra máquina vía SSH

---

### Fase 2 — Servicios Base del Servidor

**Objetivo**: PostgreSQL, Redis, Docker, y entorno de desarrollo Node.js/Python.

```bash
# Paquetes esenciales
sudo pacman -S --needed \
  postgresql redis docker docker-compose \
  nginx nodejs npm python3 python-pip \
  git neovim htop btop \
  tmux ripgrep fd fzf zsh \
  openssh ufw fail2ban \
  wireguard-tools openvpn

# AUR helper
git clone https://aur.archlinux.org/yay.git /tmp/yay
cd /tmp/yay && makepkg -si
cd ~

# Desde AUR
yay -S --needed \
  paru \
  postgresql-libs \
  nvm \
  google-chrome \
  visual-studio-code-bin

# PostgreSQL
sudo -iu postgres initdb -D /var/lib/postgres/data
sudo systemctl enable --now postgresql

# Redis
sudo systemctl enable --now redis

# Docker
sudo usermod -aG docker john
sudo systemctl enable --now docker

# NVM (Node Version Manager)
source /usr/share/nvm/init.nvm
nvm install 22
nvm alias default 22

# Entorno virtual Python
python -m venv ~/venv/dev
```

#### Servicios a habilitar

| Servicio | Puerto | Propósito |
|---|---|---|
| `sshd` | 22 | Acceso remoto |
| `postgresql` | 5432 | Base de datos |
| `redis` | 6379 | Cache/sesiones |
| `docker` | socket | Contenedores |
| `nginx` | 80/443 | Proxy reverso (local) |
| `fail2ban` | — | Seguridad SSH |

---

### Fase 3 — Interfaz Gráfica (Desktop)

**Objetivo**: Entorno gráfico minimalista para desarrollo y navegación.

```bash
# i3wm (window manager minimalista)
sudo pacman -S --needed \
  i3-wm i3status i3lock dmenu \
  alacritty \
  firefox \
  picom \
  feh \
  polkit-gnome \
  network-manager-applet \
  volumeicon \
  bluez bluez-utils \
  pipewire pipewire-pulse wireplumber \
  noto-fonts noto-fonts-emoji ttf-nerd-fonts-symbols

# Entorno de escritorio
mkdir -p ~/.config/i3
cat > ~/.config/i3/config << 'EOF'
# i3 config — Prompt OS Workstation

set $mod Mod4

# Navegador
bindsym $mod+Shift+b exec firefox

# Terminal
bindsym $mod+Return exec alacritty

# Lanzador
bindsym $mod+d exec dmenu_run

# Cerrar ventana
bindsym $mod+Shift+q kill

# Espacios de trabajo
bindsym $mod+1 workspace number 1  # Desarrollo (terminal + editor)
bindsym $mod+2 workspace number 2  # Servidor (logs, docker)
bindsym $mod+3 workspace number 3  # Navegador
bindsym $mod+4 workspace number 4  # Bot / Asistente

# Atajo directo para workflow.sh
bindsym $mod+Shift+w exec alacritty -e bash -c "workflow.sh bot; read"

# Atajo para buscar
bindsym $mod+Shift+f exec alacritty -e bash -c "echo '¿Qué quieres hacer?'; read -r cmd; workflow.sh full \"\$cmd\""

# Barra de estado
bar {
    status_command i3status
    position top
}

# Compositor para transparencias
exec_always picom -b

# Fondo de pantalla
exec_always feh --bg-scale ~/.config/i3/wallpaper.jpg

# Polkit
exec_always /usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1

# NetworkManager tray
exec_always nm-applet

# Audio tray
exec_always volumeicon

# Pantalla de bloqueo
bindsym $mod+l exec i3lock -c 1a1a2e
EOF
```

#### Layout de espacios de trabajo

```
┌─────────┬─────────┬─────────┬─────────┐
│  WS 1   │  WS 2   │  WS 3   │  WS 4   │
│ DESARRO-│ SERVIDOR│ NAVEGA- │ BOT/    │
│ LLO     │         │ DOR     │ ASIST.  │
│         │         │         │         │
│ term +  │ docker  │ firefox │ bot cli │
│ neovim  │ logs    │ + docs  │ + chat  │
│         │ htop    │         │         │
└─────────┴─────────┴─────────┴─────────┘
```

---

### Fase 4 — Prompt OS + workflow.sh

**Objetivo**: Instalar y configurar el Prompt OS como capa de orquestación.

```bash
# Clonar el repositorio (desde tu fork)
git clone https://github.com/Jairdeveloper/Tienda-online.git ~/tienda-online
cd ~/tienda-online

# Bootstrap del Prompt OS
mkdir -p ~/.workflow/{inbox/pending,outbox/{proposals,plans,results,verifications}}
mkdir -p ~/.workflow/state/history
mkdir -p ~/.workflow/config
mkdir -p ~/.workflow/modules/{available,enabled}
mkdir -p ~/.workflow/{profile,training,symbols,ir,log,plugins,tmp,bot}

# Estado inicial
echo "idle" > ~/.workflow/state/current
echo "0" > ~/.workflow/state/cycle

# Config inicial
cat > ~/.workflow/config/providers.cfg << 'EOF'
AI_PROVIDER_DEV=opencode
AI_PROVIDER_CHAT=opencode
AI_FALLBACK=true
EOF

# Alias
echo 'alias wf="~/tienda-online/workflow.sh"' >> ~/.bashrc
echo 'alias dev="wf full"' >> ~/.bashrc
echo 'alias st="wf daemon status && wf monitor all"' >> ~/.bashrc

# Activar daemon de systemd para workflow.sh
# (Copiar unidad de servicio del repositorio o crear manualmente)
mkdir -p ~/.config/systemd/user/

cat > ~/.config/systemd/user/workflow-daemon.service << 'EOF'
[Unit]
Description=workflow.sh Prompt OS Daemon
After=network.target

[Service]
Type=simple
ExecStart=%h/tienda-online/workflow.sh daemon listen
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable workflow-daemon
systemctl --user start workflow-daemon
```

---

### Fase 5 — Despliegue de Aplicaciones

**Objetivo**: Tener la tienda online corriendo localmente como servidor de desarrollo.

```bash
# Clonar el monorepo (si no está ya)
cd ~/tienda-online

# Dependencias del proyecto
cd apps/api && npm install
cd ../web && npm install
cd ../..

# Configurar variables de entorno
cp .env.example .env
# Editar .env con conexiones locales

# Base de datos
sudo -iu postgres createdb tienda_online
sudo -iu postgres psql -c "CREATE USER tienda WITH PASSWORD 'tienda_dev';"
sudo -iu postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tienda_online TO tienda;"

# Prisma
cd apps/api
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
cd ../..

# Microservicio Bot Python
cd bot/tienda-online-support-bot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # (cuando tenga dependencias)
cd ../..

# Crear servicio systemd para la API
sudo tee /etc/systemd/system/tienda-api.service << 'EOF'
[Unit]
Description=@tienda/api NestJS Backend
After=network.target postgresql.service redis.service

[Service]
Type=exec
User=john
WorkingDirectory=/home/john/tienda-online/apps/api
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=development
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now tienda-api

# Crear servicio systemd para el Bot Python
sudo tee /etc/systemd/system/tienda-bot.service << 'EOF'
[Unit]
Description=@tienda/bot Python Microservice
After=network.target

[Service]
Type=exec
User=john
WorkingDirectory=/home/john/tienda-online/bot/tienda-online-support-bot
ExecStart=/usr/bin/python3 server.py
Restart=on-failure
RestartSec=10
Environment=BOT_PORT=8000
Environment=API_BASE_URL=http://localhost:3000/api/v1

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now tienda-bot
```

#### Mapa de servicios en el servidor

| Servicio | Puerto | Estado |
|---|---|---|
| Tienda API (NestJS) | 3000 | systemd |
| Bot Python | 8000 | systemd |
| PostgreSQL | 5432 | systemd |
| Redis | 6379 | systemd |
| Docker | socket | systemd |
| Nginx (proxy local) | 80 | systemd |

---

### Fase 6 — Red y Acceso Remoto

**Objetivo**: Acceder al servidor desde otros dispositivos (otra laptop, celular, etc.).

#### 6.1 Red local (LAN)

```bash
# IP fija local (opcional)
sudo nmcli con mod "Wired connection 1" ipv4.method manual \
  ipv4.addresses 192.168.1.100/24 \
  ipv4.gateway 192.168.1.1 \
  ipv4.dns 1.1.1.1

# Firewall básico
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw enable
```

#### 6.2 Acceso remoto (VPN)

Opción recomendada: **WireGuard** para acceso seguro desde internet.

```bash
# Servidor WireGuard
sudo pacman -S wireguard-tools

# Generar claves
wg genkey | tee /etc/wireguard/server.key
chmod 600 /etc/wireguard/server.key
cat /etc/wireguard/server.key | wg pubkey > /etc/wireguard/server.pub

# Configuración
sudo tee /etc/wireguard/wg0.conf << 'EOF'
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <contenido de server.key>

[Peer]
# Cliente (tu otro dispositivo)
PublicKey = <public key del cliente>
AllowedIPs = 10.0.0.2/32
EOF

sudo systemctl enable --now wg-quick@wg0
```

#### 6.3 Opción alternativa: Tailscale (más simple)

```bash
# Tailscale — VPN mesh zero-config
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
# → Abrir URL, autenticar, listo.
# Tu laptop ahora es accesible via Tailscale IP (100.x.x.x)
# Ventaja: no necesita puertos abiertos, NAT traversal automático
```

#### 6.4 Flujo de trabajo remoto

```
Desde otra laptop (remoto):
  ssh john@100.x.x.x                    # Tailscale IP
  # o
  ssh john@192.168.1.100                # LAN

  # Ya en el servidor:
  cd ~/tienda-online
  wf st                    # estado del sistema
  wf dev analyze           # obtener contexto
  wf full "agregar algo"   # ciclo de desarrollo
  wf bot "consulta"        # preguntar al bot

  # Desarrollo local en la laptop-lenovo:
  Modo 4 (WS 4): terminal + Firefox + bot
  # Desarrollo remoto desde otra máquina:
  SSH + tmux + Neovim
```

---

### Fase 7 — Monitoreo y Mantenimiento

```bash
# Monitoreo básico
sudo pacman -S btop

# Panel web opcional (Cockpit)
sudo pacman -S cockpit
sudo systemctl enable --now cockpit.socket
# Acceder: https://laptop-ip:9090

# Respaldos automáticos con snapshots btrfs
# (usando snapper o script propio)

# Script de backup diario
cat > ~/.local/bin/backup-daily.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y-%m-%d)
btrfs subvolume snapshot -r / /.snapshots/root-$DATE
btrfs subvolume snapshot -r /home /.snapshots/home-$DATE
echo "Snapshot $DATE creado"
EOF
chmod +x ~/.local/bin/backup-daily.sh

# Timer systemd para backup diario
cat > ~/.config/systemd/user/backup-daily.service << 'EOF'
[Unit]
Description=Daily btrfs snapshot

[Service]
Type=oneshot
ExecStart=%h/.local/bin/backup-daily.sh
EOF

cat > ~/.config/systemd/user/backup-daily.timer << 'EOF'
[Unit]
Description=Daily backup at 02:00

[Timer]
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now backup-daily.timer
```

---

## 4. Paquetes Esenciales — Lista Completa

### Sistema base
```
base base-devel linux linux-firmware btrfs-progs
intel-ucode (o amd-ucode)
networkmanager
openssh
```

### Servidores
```
postgresql redis docker docker-compose
nginx
```

### Desarrollo
```
nodejs npm python3 python-pip git
neovim ripgrep fd fzf tmux
```

### Gráficos (i3wm)
```
xorg xorg-xinit i3-wm i3status i3lock dmenu
alacritty firefox
picom feh
noto-fonts ttf-nerd-fonts-symbols
```

### Audio / Bluetooth
```
pipewire pipewire-pulse wireplumber
bluez bluez-utils
```

### Red / Seguridad
```
wireguard-tools ufw fail2ban
tailscale (opcional)
```

### Herramientas del sistema
```
htop btop
unzip p7zip
man-db man-pages texinfo
```

---

## 5. Presupuesto de Hardware (Referencia)

| Componente | Modelo Recomendado | Precio aprox (usado) |
|---|---|---|
| **Laptop** | ThinkPad X1 Carbon Gen 7/8 | 300-500€ |
| **RAM** | 16GB+ (soldada en X1C, DIMM en T-series) | — |
| **SSD** | NVMe 512GB+ | 40-80€ |
| **Batería** | Repuesto OEM | 30-60€ |
| **Total** | — | **~350-600€** |

Alternativa económica: ThinkPad T480 (~200€) — RAM expandible, batería dual, soporte excelente.

---

## 6. Análisis de Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Corte de luz** | Servidor caído | Batería de la laptop (~4-8h). Opcional: UPS |
| **WiFi inestable** | Servidor no accesible | Usar Ethernet para el servidor, WiFi para desktop |
| **Sobrecalentamiento** | Rendimiento reducido | `tlp` para gestión térmica. Undervolt si es posible |
| **Actualización rolling** | Paquete roto | `pacman -Syu` con precaución. Snapshots btrfs antes de actualizar |
| **Robo** | Datos comprometidos | LUKS obligatorio. SSH con claves, no contraseñas |
| **HDD/SSD falla** | Pérdida de datos | Snapshots btrfs + backup externo periódico |

---

## 7. Conclusión

**Viable. Recomendado.**

Arch Linux en una laptop Lenovo es una solución excelente para un **servidor de desarrollo auto-gestionado** que:

1. **Sirve como servidor 24/7** con batería integrada (UPS natural)
2. **Funciona como estación de trabajo** cuando te sientas frente a ella
3. **Se integra con Prompt OS** — `workflow.sh` orquesta todo: servicios, desarrollo, sistema
4. **Es accesible remotamente** vía SSH/WireGuard/Tailscale desde cualquier dispositivo
5. **Cuesta ~300-500€** (laptop usada) vs ~20-50€/mes de VPS

La clave del éxito es:
- **Usar btrfs + LUKS** desde el día 1 (snapshots + cifrado)
- **Separar claramente** servicios del sistema (systemd) de la sesión gráfica (i3)
- **Configurar acceso remoto** antes de necesitarlo (WireGuard o Tailscale)
- **Aprovechar Prompt OS** — ya tienes la especificación y el orquestador (`workflow.sh`)

---

## 8. Referencias

- [Arch Linux Installation Guide](https://wiki.archlinux.org/title/Installation_guide)
- [Arch Wiki: ThinkPad](https://wiki.archlinux.org/title/Laptop/Lenovo)
- [Arch Wiki: btrfs](https://wiki.archlinux.org/title/Btrfs)
- [Arch Wiki: systemd](https://wiki.archlinux.org/title/Systemd)
- [Arch Wiki: i3](https://wiki.archlinux.org/title/I3)
- [WireGuard Arch Wiki](https://wiki.archlinux.org/title/WireGuard)
- `ALGP005_WORKFLOW_OS_ARCH_v1_0_DRAFT.md` — Prompt OS Spec
- `workflow/020_DEV_WORKFLOW_1_0_DRAFT.md` — Workflow.sh base
- `workflow/032_DEV_SPEC_PROMPT_COMPILER_WORKFLOW_1_0_DRAFT.md` — Prompt Compiler
- `workflow/035_EXEC_PLAN_PROMPT_OS_1_0_DRAFT.md` — Plan de ejecución Prompt OS
