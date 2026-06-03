---
id: alg_p_005
area: algorithms
type: ALGP
module: workflow-os
version: 1.0
status: DRAFT
author: workflow-agent
created: 2026-06-02
last_updated: 2026-06-02
tags:
  - workflow
  - architecture
  - prompt-os
  - operating-system
  - arch-linux
  - kernel
  - automation
  - algorithm
summary: "Especificacion arquitectonica de Prompt OS: capa sobre Arch Linux donde workflow.sh actua como kernel/orquestador de todo el entorno de trabajo del usuario."
keywords:
  - prompt-os
  - workflow.sh
  - arch-linux
  - sistema-operativo
  - kernel
  - promptfs
  - compilador
  - modos
  - daemon
  - package-manager
  - bot
  - entrenamiento
  - perfil
  - tui
changelog:
  - version: 1.0
    date: 2026-06-02
    author: workflow-agent
    changes:
      - "Creacion inicial de la especificacion Prompt OS sobre Arch Linux"
---

# Prompt OS — Arquitectura de workflow.sh como capa sobre Arch Linux

## 0. Resumen

**Prompt OS** es una especificacion arquitectonica que define a `workflow.sh`
como el nucleo (kernel) de un sistema operativo orientado a prompt sobre
Arch Linux. No es un sistema operativo real — es una **capa de abstraccion**
que unifica desarrollo, automatizacion, configuracion del sistema, IA y
documentacion bajo una misma filosofia: **everything is a file + everything
is a prompt**.

Este documento describe los componentes, modos, estructura de archivos,
integracion con Arch Linux, ciclo de vida de instrucciones, instalacion
y roadmap de implementacion.

---

## 1. Filosofia general

### 1.1 workflow.sh como kernel del Prompt OS

```
Arch Linux          ← Hardware abstraction layer (kernel real)
  ↓
Prompt OS           ← workflow.sh como capa de orquestacion
  ↓
Modos y modulos     ← Comandos y subsistemas (dev, sys, doc, ai)
  ↓
Interfaz de usuario ← CLI, TUI, HTTP, Bot
```

`workflow.sh` no reemplaza a Arch Linux. Se sienta **sobre** el sistema
operativo real y orquesta sus componentes (pacman, systemd, NetworkManager,
etc.) mediante wrappers unificados. El usuario interactua con `workflow.sh`
como si fuera un shell mejorado, sin necesidad de recordar comandos
especificos de cada herramienta.

### 1.2 Everything is a file + Everything is a prompt

Dos principios fundamentales:

| Principio | Significado | Ejemplo |
|-----------|-------------|---------|
| **Everything is a file** | Estado, configuracion, colas, artefactos y aprobaciones son archivos en disco | `.workflow/state`, `.workflow/inbox/*.md` |
| **Everything is a prompt** | Toda instruccion, comando o configuracion se expresa como un prompt en lenguaje natural | `workflow.sh "Instala Docker"` → compila a acciones del sistema |

### 1.3 Arch como base

Arch Linux proporciona la infraestructura base:

| Componente Arch | Rol en Prompt OS |
|-----------------|------------------|
| **pacman** | Gestion de paquetes del sistema |
| **AUR (yay/paru)** | Paquetes de la comunidad |
| **systemd** | Servicios del sistema y usuario |
| **Linux kernel** | Hardware, drivers, filesystem |
| **NetworkManager** | Conectividad de red |
| **pipewire/pulse** | Audio |
| **bluez** | Bluetooth |
| **Docker/Podman** | Contenedores |
| **filesystem** | Estructura de directorios |

### 1.4 Modos de operacion

| Modo | Proposito | Ejemplos |
|------|-----------|----------|
| **Desarrollo** | Ciclo de programacion con IA | `analyze`, `propose`, `plan`, `execute`, `verify`, `full` |
| **Sistema** | Gestion del sistema operativo | `pkg`, `daemon`, `net`, `audio`, `bt`, `container` |
| **Documentacion** | Creacion y mantenimiento de documentacion | `doc`, `compile`, `synthesize` |
| **Aprendizaje** | Entrenamiento del perfil de usuario | `train`, `profile`, `predict` |
| **IA** | Interaccion con asistentes de IA | `ai`, `bot`, `agent` |
| **Configuracion** | Gestion del Prompt OS | `config`, `schedule`, `dotfiles`, `backup` |

---

## 2. Arquitectura

### 2.1 Diagrama de capas

```
┌──────────────────────────────────────────────────────┐
│                    INTERFACES                         │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐  │
│  │   CLI    │  │ TUI(Ink) │  │ HTTP API │  │ Bot  │  │
│  │ (bash)   │  │ (React)  │  │(Express) │  │(Py)  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──┬───┘  │
│       │             │             │           │       │
├───────┴─────────────┴─────────────┴───────────┴───────┤
│               PROMPT OS (workflow.sh)                  │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ PromptFS │  │ Compiler │  │  Package Manager   │  │
│  │ /inbox   │  │ LEX→PARSE│  │  pkg install/list  │  │
│  │ /outbox  │  │ →SEMANTIC│  │  pkg remove/search │  │
│  │ /state   │  │ →SCORE   │  │  pkg aur/update    │  │
│  │ /config  │  │ →IR→SYNTH│  └────────────────────┘  │
│  └──────────┘  └──────────┘                           │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Daemon   │  │Training  │  │  AI Provider Layer │  │
│  │ (systemd)│  │ & Profile│  │  opencode / OpenAI │  │
│  │ listen   │  │ scoring  │  │  / Anthropic       │  │
│  └──────────┘  └──────────┘  └────────────────────┘  │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │         System Wrappers (modos)              │    │
│  │  pkg │ daemon │ config │ net │ audio │ bt    │    │
│  │  container │ edit │ git │ dotfiles │ backup  │    │
│  │  monitor │ app │ schedule │ help             │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
├───────────────────────────────────────────────────────┤
│                  ARCH LINUX                            │
│                                                       │
│  ┌──────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐  │
│  │pacman│ │systemd │ │NetworkMgr│ │  Linux Kernel │  │
│  │ yay  │ │timers  │ │bluez     │ │  (hardware)   │  │
│  └──────┘ └────────┘ └──────────┘ └──────────────┘  │
└───────────────────────────────────────────────────────┘
```

### 2.2 Flujo de datos entre capas

```
Usuario → [CLI/TUI/Bot] → workflow.sh → [Prompt Compiler]
                                         ↓
                                   PromptFS (~/.workflow/)
                                         ↓
                                   System Wrappers
                                         ↓
                                   Arch Linux (pacman, systemd, etc.)
                                         ↓
                                   Resultado → outbox/ → feedback → training/
```

---

## 3. Componentes del Prompt OS

### 3.1 PromptFS — Sistema de archivos virtual

PromptFS es el sistema de archivos virtual del Prompt OS. Todo en el sistema
es un archivo: instrucciones, estado, configuracion, resultados, perfil,
entrenamiento y cache.

**Estructura completa de `~/.workflow/`**:

```
~/.workflow/                       # HOME del Prompt OS
│
├── inbox/                         # Instrucciones entrantes
│   ├── cycle_42_instruction.md    # Instruccion del ciclo actual
│   └── pending/                   # Instrucciones en cola
│
├── outbox/                        # Resultados de ciclos
│   ├── proposals/                 # Propuestas generadas
│   ├── plans/                     # Planes de ejecucion
│   ├── results/                   # Resultados de ejecucion
│   └── verifications/             # Reportes de verificacion
│
├── state/                         # Estado del sistema
│   ├── current                    # Estado actual (idle, executing, etc.)
│   ├── cycle                      # Contador de ciclo
│   ├── lock                       # Lock de exclusion mutua
│   ├── checkpoint                 # Ultimo paso ejecutado
│   └── history/                   # Historial de estados por ciclo
│
├── config/                        # Configuracion del OS
│   ├── providers.cfg              # Proveedores IA habilitados
│   ├── aliases.cfg                # Atajos y alias personalizados
│   ├── theme.cfg                  # Tema para TUI
│   ├── policy.yml                 # Politicas de seguridad y aprobacion
│   └── bootstrap.lock             # Marca de bootstrap completado
│
├── modules/                       # Modos instalables
│   ├── available/                 # Modos descargados no activos
│   │   ├── net.sh
│   │   ├── audio.sh
│   │   └── container.sh
│   └── enabled/                   # Modos activos (symlinks a available/)
│       ├── propose.sh → ../available/propose.sh
│       ├── plan.sh → ../available/plan.sh
│       ├── execute.sh → ../available/execute.sh
│       └── net.sh → ../available/net.sh
│
├── profile/                       # Perfil de usuario
│   ├── default.yml                # Preferencias generales
│   ├── frequent_actions.jsonl     # Acciones frecuentes del usuario
│   ├── approval_patterns.jsonl    # Patrones de aprobacion/rechazo
│   └── command_policy.yml         # Politica personal de comandos
│
├── training/                      # Entrenamiento continuo
│   ├── examples.jsonl             # Ejemplos aceptados/rechazados
│   ├── corrections.jsonl          # Correcciones del usuario
│   ├── accepted_plans.jsonl       # Planes que el usuario aprobo
│   └── rejected_plans.jsonl       # Planes que el usuario rechazo
│
├── symbols/                       # Tabla de simbolos
│   ├── default.json               # Simbolos del proyecto
│   └── user.json                  # Simbolos personalizados
│
├── ir/                            # Representacion intermedia
│   ├── cycle_42_AST.json          # Arbol sintactico
│   ├── cycle_42_IR.json           # IR canonico
│   ├── cycle_42_TAC.ir            # Codigo de tres direcciones
│   └── cycle_42_DECISION.md       # Traza de decision
│
├── log/                           # Logs del sistema
│   ├── workflow.log               # Log principal
│   ├── daemon.log                 # Log del daemon
│   └── audit.log                  # Log de auditoria
│
├── plugins/                       # Plugins de terceros
│
├── tmp/                           # Archivos temporales
│
└── bot/                           # Estado del bot conversacional
    ├── session_id
    ├── last_request.json
    ├── last_response.json
    └── conversation.md
```

### 3.2 Prompt Compiler

El Prompt Compiler es el pipeline que transforma instrucciones en lenguaje
natural a acciones del sistema. Sigue el modelo de compilador definido en
`workflow/032_DEV_SPEC_PROMPT_COMPILER_WORKFLOW_1_0_DRAFT.md`.

**Pipeline completo:**

```
Instruccion → LEX → PARSE → SEMANTIC → SCORE → IR → TRACE → SYNTHESIS → OUTPUT
```

| Fase | Funcion | Salida |
|------|---------|--------|
| **LEX** | Tokeniza la instruccion: verbos, objetos, rutas, restricciones | `[VERBO(instala), OBJETO(docker), ...]` |
| **PARSE** | Construye arbol de intencion desde los tokens | AST (arbol sintactico abstracto) |
| **SEMANTIC** | Resuelve significado con contexto del proyecto y perfil | AST enriquecido con metadatos |
| **SCORE** | Evalua confianza usando acciones frecuentes y perfil | `{ intent, confidence, risk }` |
| **IR** | Genera representacion intermedia canonica JSON | `cycle_N_IR.json` |
| **TRACE** | Emite codigo de tres direcciones para auditoria | `cycle_N_TAC.ir` |
| **SYNTHESIS** | Sintetiza propuesta, plan, comando o mensaje | Archivo en outbox/ |

**Ejemplo de compilacion:**
```
Input: "Instala Docker y configura red WiFi"
  ↓ LEX: [VERBO(instala), OBJETO(docker), CONJUNCION(y), VERBO(configura), OBJETO(red), MODIFICADOR(wifi)]
  ↓ PARSE:
    Instruction
    ├── Goal: install
    │   └── Target: docker
    └── Goal: configure
        └── Target: wifi
  ↓ SEMANTIC: docker → pkg, wifi → net
  ↓ IR: { goals: [{action: "install", pkg: "docker"}, {action: "wifi_connect"}], confidence: 0.92 }
  ↓ SYNTHESIS:
    workflow.sh pkg install docker
    workflow.sh net wifi connect --scan
```

### 3.3 Package Manager — Gestion de modulos

El sistema de paquetes del Prompt OS gestiona modos y modulos instalables.

**Comandos:**

| Comando | Funcion |
|---------|---------|
| `workflow.sh pkg install <modo>` | Instala un nuevo modo desde el registro |
| `workflow.sh pkg remove <modo>` | Desinstala un modo |
| `workflow.sh pkg list` | Lista modos instalados y disponibles |
| `workflow.sh pkg search <query>` | Busca modos en el registro |
| `workflow.sh pkg update` | Actualiza todos los modos instalados |
| `workflow.sh pkg aur <paquete>` | Instala paquete de Arch via AUR (yay/paru) |
| `workflow.sh pkg info <modo>` | Muestra informacion detallada de un modo |

**Ciclo de vida de un modo:**

```
1. workflow.sh pkg search "net"           # Buscar modos de red
2. workflow.sh pkg install net            # Descarga net.sh a ~/.workflow/modules/available/
3. Activa: symlink en ~/.workflow/modules/enabled/
4. Uso: workflow.sh net wifi connect ...
5. workflow.sh pkg remove net             # Elimina symlink y archivo
```

**Formato de un modo instalable:**

```bash
# mode: net
# version: 1.0
# description: Network management mode for Prompt OS
# dependencies: networkmanager, nmcli
# tags: system, network, wifi

mode_net_wifi_connect() {
    # Implementacion del comando
}

mode_net_wifi_scan() {
    # Implementacion del comando
}

mode_net_status() {
    # Implementacion del comando
}
```

### 3.4 Init System — Daemon y servicios

`workflow.sh` funciona como gestor de servicios (init) del Prompt OS.

**Comandos del daemon:**

| Comando | Funcion |
|---------|---------|
| `workflow.sh daemon start` | Inicia el daemon en background |
| `workflow.sh daemon stop` | Detiene el daemon |
| `workflow.sh daemon restart` | Reinicia el daemon |
| `workflow.sh daemon status` | Muestra estado del daemon |
| `workflow.sh daemon enable` | Activa el servicio systemd de usuario |
| `workflow.sh daemon disable` | Desactiva el servicio systemd |
| `workflow.sh daemon logs` | Muestra logs del daemon |
| `workflow.sh daemon listen` | Ejecuta en foreground modo escucha |

**El daemon en modo listen:**

1. Monitorea `~/.workflow/inbox/` en busca de nuevos archivos `.md`
2. Cuando aparece una instruccion: la compila, ejecuta y registra
3. Soporta notificaciones desktop via `notify-send`
4. Se integra con systemd como servicio de usuario

### 3.5 AI Provider Layer — Multi-provider con fallback

El Prompt OS soporta multiples proveedores de IA, configurables por tarea.

**Proveedores:**

| Proveedor | Tipo | Uso principal | Estado |
|-----------|------|---------------|--------|
| **opencode** | Local (CLI) | Desarrollo, propuestas, plan | Default |
| **OpenAI** | API cloud | Analisis complejo, syntesis | Opcional |
| **Anthropic** | API cloud | Bot conversacional | Opcional |
| **Local LLM** | Local (ollama) | Modo offline, tareas simples | Futuro |

**Configuracion (`~/.workflow/config/providers.cfg`):**

```bash
# Proveedor por defecto para cada tipo de tarea
AI_PROVIDER_DEV=opencode        # Desarrollo: propuestas, planes
AI_PROVIDER_CHAT=openai         # Bot conversacional
AI_PROVIDER_ANALYSIS=anthropic  # Analisis profundo

# Fallback: si el primario falla, usar este
AI_FALLBACK=true

# APIs keys (almacenadas fuera del repo)
OPENAI_KEY=sk-...
ANTHROPIC_KEY=sk-ant-...
```

**Logica de fallback:**

```
1. Usar proveedor primario segun tipo de tarea
2. Si primary falla (timeout, error, no disponible):
   a. Intentar fallback
   b. Si fallback tambien falla: modo degraded (sin IA)
3. Registrar en training/ la caida del proveedor
```

### 3.6 Training & Profile — Aprendizaje continuo

Cada interaccion con el Prompt OS entrena al sistema para mejorar
predicciones y adaptarse al usuario.

**Fuentes de entrenamiento:**

| Fuente | Formato | Proposito |
|--------|---------|-----------|
| Planes aceptados | `training/accepted_plans.jsonl` | Aprender que planes prefiere el usuario |
| Planes rechazados | `training/rejected_plans.jsonl` | Aprender que evitar |
| Correcciones | `training/corrections.jsonl` | Correcciones explicitas del usuario |
| Acciones frecuentes | `profile/frequent_actions.jsonl` | Detectar patrones de uso |
| Patrones de aprobacion | `profile/approval_patterns.jsonl` | Cuando aprueba/rechaza sin cambios |
| Git log | `git log --oneline` | Historial de cambios del proyecto |
| CHANGELOG.md | Documento | Registro de cambios versionados |

**Scoring multi-factor:**

```
score = w1 * intent_similarity
      + w2 * file_pattern_similarity
      + w3 * command_policy_similarity
      + w4 * documentation_style_similarity
      + w5 * approval_history_similarity
      + w6 * time_of_day_pattern
```

Donde `w1..w6` son pesos configurables por perfil.

**Perfil de usuario (`~/.workflow/profile/default.yml`):**

```yaml
user:
  name: "developer"
  style:
    language: es
    docsFirst: true
    requiresChangelogBeforePush: true
    prefersDryRun: true
  approvedCommands:
    - git
    - python3
    - npm (with approval)
  rejectedCommands:
    - rm -rf /
  frecuentActions:
    - create_documentation
    - run_tests
    - git_commit
  schedule:
    deepWork: 08:00-12:00
    meetings: 14:00-16:00
  providers:
    dev: opencode
    chat: openai
```

### 3.7 Bot Assistant — Asistente conversacional

El Bot Assistant es un modo conversacional que permite al usuario
interactuar con el Prompt OS en lenguaje natural sin recordar comandos.

**Capacidades del bot:**

- Conoce todos los modos, flags y comandos del sistema
- Ayuda a redactar instrucciones para el Prompt Compiler
- Sugiere comandos basados en el contexto actual
- Puede ejecutar ciclos completos bajo supervision
- Mantiene historial de conversacion en `~/.workflow/bot/conversation.md`

**Integracion con el bot Python existente:**

El bot se apoya en el bot Python ubicado en `bot/tienda-online-support-bot`
(definido en `workflow/031_DEV_SPEC_WORKFLOW_BOT_AGENT_1_0_DRAFT.md`),
pero puede funcionar de forma independiente usando el AI Provider Layer.

---

## 4. Integracion con Arch Linux

### 4.1 Tabla de integracion

| Componente Arch | Comando Prompt OS | Wrapper |
|-----------------|-------------------|---------|
| **pacman** | `workflow.sh pkg install <pkg>` | `sudo pacman -S --noconfirm <pkg>` |
| **pacman** | `workflow.sh pkg remove <pkg>` | `sudo pacman -Rns <pkg>` |
| **pacman** | `workflow.sh pkg update` | `sudo pacman -Syu` |
| **pacman** | `workflow.sh pkg search <q>` | `pacman -Ss <q>` |
| **systemd** | `workflow.sh daemon start/stop/status` | `systemctl --user start/stop/status` |
| **systemd** | `workflow.sh daemon enable/disable` | `systemctl --user enable/disable` |
| **AUR (yay)** | `workflow.sh pkg aur <pkg>` | `yay -S <pkg>` |
| **AUR (paru)** | `workflow.sh pkg aur <pkg>` | `paru -S <pkg>` |
| **NetworkManager** | `workflow.sh net wifi connect` | `nmcli dev wifi connect <ssid>` |
| **NetworkManager** | `workflow.sh net status` | `nmcli general status` |
| **NetworkManager** | `workflow.sh net scan` | `nmcli dev wifi list` |
| **bluetoothctl** | `workflow.sh bt scan` | `bluetoothctl scan on` |
| **bluetoothctl** | `workflow.sh bt connect` | `bluetoothctl connect <mac>` |
| **pipewire/pulse** | `workflow.sh audio volume` | `pactl set-sink-volume @DEFAULT_SINK@ <val>` |
| **pipewire/pulse** | `workflow.sh audio mic` | `pactl set-source-volume @DEFAULT_SOURCE@ <val>` |
| **pipewire/pulse** | `workflow.sh audio mute` | `pactl set-sink-mute @DEFAULT_SINK@ toggle` |
| **Docker** | `workflow.sh container ps` | `docker ps` |
| **Podman** | `workflow.sh container ps` | `podman ps` |
| **Git** | `workflow.sh git status` | `git status` |
| **Git** | `workflow.sh git commit` | `git commit -m <msg>` (con protocolo changelog) |
| **Git** | `workflow.sh git push` | `git push` (solo si CHANGELOG.md actualizado) |
| **cron/systemd-timer** | `workflow.sh schedule add` | `systemd-timer` o `crontab` |
| **Neovim/VS Code** | `workflow.sh edit <file>` | `$EDITOR <file>` |
| **Desktop entries** | `workflow.sh app launch <app>` | `gtk-launch <app>` o `xdg-open` |

### 4.2 Deteccion automatica de herramientas

`workflow.sh` detecta automaticamente que herramientas estan disponibles
en el sistema y adapta los wrappers:

```bash
# Ejemplo: deteccion de AUR helper
detect_aur_helper() {
    if command -v yay >/dev/null 2>&1; then
        echo "yay"
    elif command -v paru >/dev/null 2>&1; then
        echo "paru"
    else
        echo ""
    fi
}
```

### 4.3 Permisos y seguridad

- Comandos que requieren `sudo` se ejecutan con `sudo` (el usuario debe tener
  permisos sudo configurados)
- Comandos destructivos (`pkg remove`, `backup restore`, etc.) requieren
  confirmacion explicita
- El daemon corre como servicio de usuario (`systemctl --user`), no como root

---

## 5. Modos del sistema (workflow.sh como OS)

### 5.1 Modos de desarrollo (actuales + mejorados)

| Modo | Funcion | Estado |
|------|---------|--------|
| `analyze <texto>` | Escanea src/ y genera contexto | ✅ Existente |
| `propose <texto>` | Genera propuesta desde instruccion | ✅ Existente |
| `plan <ruta>` | Genera plan desde propuesta | ✅ Existente |
| `execute <ruta>` | Ejecuta plan paso a paso | ✅ Existente |
| `verify` | npm run build + npm test | ✅ Existente |
| `full --auto <texto>` | Ciclo completo sin intervencion | ✅ Existente |
| `ai <texto>` | Propuesta via opencode con contexto | ✅ Existente |
| `compile <texto>` | Compila lenguaje natural a IR | 🚧 Propuesto |
| `predict <texto>` | Predice accion mas probable sin ejecutar | 🚧 Propuesto |
| `synthesize <ir>` | Genera propuesta/plan/codigo desde IR | 🚧 Propuesto |
| `train <ejemplo>` | Registra ejemplo aceptado/rechazado | 🚧 Propuesto |
| `profile` | Muestra perfil aprendido del usuario | 🚧 Propuesto |

### 5.2 Modos de sistema

#### `pkg` — Gestion de paquetes y modulos

```
workflow.sh pkg install <modo>    # Instalar modo Prompt OS
workflow.sh pkg install <pkg>     # Instalar paquete Arch (wrapper pacman)
workflow.sh pkg remove <modo>     # Desinstalar modo
workflow.sh pkg remove <pkg>      # Desinstalar paquete Arch
workflow.sh pkg list              # Listar modos instalados
workflow.sh pkg search <query>    # Buscar modos o paquetes
workflow.sh pkg update            # Actualizar modos + sistema
workflow.sh pkg aur <pkg>         # Instalar desde AUR
workflow.sh pkg info <modo>       # Info detallada de modo
```

#### `daemon` — Gestion de servicios

```
workflow.sh daemon start          # Iniciar daemon
workflow.sh daemon stop           # Detener daemon
workflow.sh daemon restart        # Reiniciar daemon
workflow.sh daemon status         # Estado del daemon
workflow.sh daemon enable         # Activar en systemd
workflow.sh daemon disable        # Desactivar en systemd
workflow.sh daemon logs           # Ver logs del daemon
workflow.sh daemon listen         # Ejecutar en foreground
```

#### `config` — Gestion de configuracion

```
workflow.sh config get <key>      # Obtener valor
workflow.sh config set <key> <val> # Establecer valor
workflow.sh config list           # Listar toda la config
workflow.sh config edit           # Abrir config en editor
workflow.sh config import <file>  # Importar config
workflow.sh config export <file>  # Exportar config
```

#### `net` — Red

```
workflow.sh net status            # Estado de red
workflow.sh net scan              # Escanear redes WiFi
workflow.sh net wifi connect <ssid> [password]  # Conectar WiFi
workflow.sh net wifi disconnect   # Desconectar WiFi
workflow.sh net info              # Informacion de interfaces
```

#### `audio` — Audio

```
workflow.sh audio volume <0-100>  # Volumen general
workflow.sh audio mic <0-100>     # Volumen microfono
workflow.sh audio mute [sink|mic] # Silenciar
workflow.sh audio unmute [sink|mic] # Quitar silencio
workflow.sh audio sink list       # Listar dispositivos de salida
workflow.sh audio source list     # Listar dispositivos de entrada
```

#### `bt` — Bluetooth

```
workflow.sh bt status             # Estado de bluetooth
workflow.sh bt scan               # Escanear dispositivos
workflow.sh bt pair <mac>         # Emparejar
workflow.sh bt connect <mac>      # Conectar
workflow.sh bt disconnect <mac>   # Desconectar
workflow.sh bt trust <mac>        # Confiar en dispositivo
workflow.sh bt list               # Dispositivos emparejados
```

#### `container` — Contenedores

```
workflow.sh container ps          # Listar contenedores activos
workflow.sh container ps -a       # Listar todos
workflow.sh container start <id>  # Iniciar contenedor
workflow.sh container stop <id>   # Detener contenedor
workflow.sh container logs <id>   # Logs del contenedor
workflow.sh container exec <id> <cmd>  # Ejecutar comando
workflow.sh container build <path>     # Construir imagen
```

#### `edit` — Editor de archivos

```
workflow.sh edit <file>           # Abrir archivo en $EDITOR
workflow.sh edit find <pattern>    # Buscar en archivos
workflow.sh edit replace <old> <new> [files]  # Reemplazar
```

#### `app` — Lanzador de aplicaciones

```
workflow.sh app launch <app>      # Lanzar aplicacion
workflow.sh app list              # Listar aplicaciones instaladas
workflow.sh app search <query>    # Buscar aplicaciones
```

#### `git` — Git integrado

```
workflow.sh git status            # Estado del repositorio
workflow.sh git diff              # Cambios sin stage
workflow.sh git log               # Historial de commits
workflow.sh git commit <msg>      # Commit con changelog check
workflow.sh git push              # Push solo si CHANGELOG.md actualizado
workflow.sh git pull              # Pull desde remoto
workflow.sh git branch            # Gestion de ramas
```

#### `dotfiles` — Gestion de dotfiles

```
workflow.sh dotfiles save <file>  # Guardar dotfile en repo
workflow.sh dotfiles load         # Cargar dotfiles al sistema
workflow.sh dotfiles diff         # Diferencias con dotfiles guardados
workflow.sh dotfiles sync         # Sincronizar dotfiles con remoto
workflow.sh dotfiles list         # Listar dotfiles gestionados
```

#### `backup` — Sistema de respaldos

```
workflow.sh backup create <name>  # Crear respaldo
workflow.sh backup restore <name> # Restaurar respaldo
workflow.sh backup list           # Listar respaldos
workflow.sh backup schedule       # Programar respaldo automatico
workflow.sh backup status         # Estado del ultimo respaldo
```

#### `monitor` — Monitoreo del sistema

```
workflow.sh monitor cpu           # Uso de CPU
workflow.sh monitor memory        # Uso de memoria
workflow.sh monitor disk          # Uso de disco
workflow.sh monitor network       # Trafico de red
workflow.sh monitor processes     # Procesos activos
workflow.sh monitor all           # Panel completo
```

#### `schedule` — Tareas programadas

```
workflow.sh schedule add <cmd> <time>    # Agregar tarea
workflow.sh schedule remove <id>         # Eliminar tarea
workflow.sh schedule list                # Listar tareas
workflow.sh schedule enable <id>         # Activar tarea
workflow.sh schedule disable <id>        # Desactivar tarea
```

#### `bot` — Asistente conversacional

```
workflow.sh bot "<mensaje>"       # Consultar al bot
workflow.sh bot-confirm "<msg>"   # Confirmar accion pendiente
workflow.sh bot session           # Estado de la sesion
```

#### `help` — Ayuda del sistema

```
workflow.sh help                  # Ayuda general
workflow.sh help <modo>           # Ayuda de un modo especifico
workflow.sh help --examples       # Ejemplos de uso
```

---

## 6. Ciclo de vida de una instruccion en el Prompt OS

### 6.1 Diagrama de flujo

```
┌─────────────────────────────────────────────────────────┐
│                    INSTRUCCION                            │
│  (CLI, TUI, HTTP, Bot, o inbox/*.md)                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              1. RECEPCION                                │
│  - workflow.sh recibe la instruccion                     │
│  - Crea archivo en inbox/ si viene por CLI/TUI           │
│  - Registra en log                                       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              2. CLASIFICACION                            │
│  - ¿Es instruccion directa (--flag)? → ejecuta directa   │
│  - ¿Es instruccion de sistema? → deriva a modo Arch      │
│  - ¿Es instruccion de desarrollo? → pipeline completo    │
│  - ¿Es instruccion al bot? → deriva a modo bot           │
│  - ¿Es ambigua? → pregunta al usuario                    │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌─────────────────┐ ┌──────────┐ ┌──────────────────┐
│  INSTRUCCION     │ │ SISTEMA  │ │   PROMPT         │
│  DIRECTA         │ │ INMEDIATO│ │   COMPILER       │
│  (flags)         │ │          │ │   (full pipeline) │
└────────┬────────┘ └────┬─────┘ └────────┬─────────┘
         │               │                │
         ▼               ▼                ▼
    Ejecutar       Wrapper Arch     LEX → PARSE
    inmediato      (pacman,etc)     → SEMANTIC → SCORE
                                    → IR → TRACE → SYNTHESIS
                                         │
                                         ▼
                               ┌─────────────────────┐
                               │  PROPUESTA / PLAN   │
                               │  (outbox/)           │
                               └──────────┬──────────┘
                                          │
                                          ▼
                               ┌─────────────────────┐
                               │  APROBACION         │
                               │  (si risk > umbral) │
                               └──────────┬──────────┘
                                          │
                                          ▼
                               ┌─────────────────────┐
                               │  EJECUCION          │
                               │  (dry-run → real)   │
                               └──────────┬──────────┘
                                          │
                         ┌────────────────┼──────────────┐
                         ▼                ▼              ▼
┌─────────────────┐ ┌──────────┐ ┌──────────────────────┐
│   RESULTADO     │ │ FEEDBACK │ │  REGISTRO           │
│   outbox/       │ │ training/│ │  profile/           │
│   stdout        │ │          │ │  log/                │
└─────────────────┘ └──────────┘ └──────────────────────┘
```

### 6.2 Ejemplo: Instruccion de sistema

```
$ workflow.sh "Instala Docker y configura red WiFi"
  ↓ RECEPCION: "Instala Docker y configura red WiFi"
  ↓ CLASIFICACION: instruccion de sistema (detecta "instala" + "configura")
  ↓ PARSEO:
    [VERBO(instala), OBJETO(docker)]
    [VERBO(configura), DOMINIO(red), OBJETO(wifi)]
  ↓ SEMANTICO:
    docker → pkg install docker
    wifi → net wifi connect --scan
  ↓ EJECUCION DIRECTA (por ser sistema):
    Paso 1: sudo pacman -S docker
    Paso 2: sudo systemctl enable --now docker
    Paso 3: nmcli dev wifi list
    Paso 4: nmcli dev wifi connect <SSID_FROM_USER>
  ↓ FEEDBACK: registro en training/
  ↓ RESULTADO: Docker instalado + WiFi conectado
```

### 6.3 Ejemplo: Instruccion de desarrollo

```
$ workflow.sh "Agrega un endpoint GET /health a la API"
  ↓ RECEPCION: "Agrega un endpoint GET /health a la API"
  ↓ CLASIFICACION: instruccion de desarrollo
  ↓ COMPILER:
    LEX: [VERBO(agrega), TIPO(endpoint), METODO(GET), RUTA(/health), OBJETIVO(API)]
    PARSE: create_endpoint(method: GET, path: /health, target: api)
    SEMANTIC: modulo salud → apps/api/src/health/
    IR: { intent: "add_endpoint", method: "GET", path: "/health", module: "health" }
    SYNTHESIS: genera propuesta y plan en outbox/
  ↓ APROBACION: el usuario revisa y aprueba
  ↓ EJECUCION: se ejecuta el plan paso a paso
  ↓ VERIFICACION: npm run build + curl localhost:3000/api/v1/health
  ↓ FEEDBACK: registro en training/ y profile/
```

---

## 7. Instalacion y bootstrap en Arch Linux

### 7.1 Bootstrap completo

```bash
# 1. Clonar repositorio
git clone https://github.com/Jairdeveloper/Tienda-online.git
cd Tienda-online

# 2. Ejecutar bootstrap (instala dependencias del sistema)
./workflow.sh bootstrap
```

**El comando `bootstrap` realiza:**

```
1. Verifica que estamos en Arch Linux (o derivado)
2. Instala dependencias base:
   - nodejs, npm, python3, git, base-devel
3. Crea estructura ~/.workflow/ completa
4. Configura git con valores por defecto (si no existe)
5. Instala yay/paru si no existe (para AUR)
6. Instala modulo HTTP server (apps/server/)
7. Instala modulo TUI (apps/tui/)
8. Crea ~/.workflow/config/providers.cfg por defecto
9. Crea ~/.workflow/profile/default.yml
10. Marca bootstrap como completado (~/.workflow/config/bootstrap.lock)

Si algo falla, se puede re-ejecutar: es idempotente.
```

### 7.2 Bootstrap manual (paso a paso)

```bash
# 1. Clonar
git clone https://github.com/Jairdeveloper/Tienda-online.git
cd Tienda-online

# 2. Instalar dependencias del sistema
sudo pacman -S --needed nodejs npm python3 git base-devel

# 3. Crear estructura Prompt OS
mkdir -p ~/.workflow/{inbox/pending,outbox/{proposals,plans,results,verifications}}
mkdir -p ~/.workflow/state/history
mkdir -p ~/.workflow/config
mkdir -p ~/.workflow/modules/{available,enabled}
mkdir -p ~/.workflow/profile
mkdir -p ~/.workflow/training
mkdir -p ~/.workflow/symbols
mkdir -p ~/.workflow/ir
mkdir -p ~/.workflow/{log,plugins,tmp,bot}

# 4. Estado inicial
echo "idle" > ~/.workflow/state/current
echo "0" > ~/.workflow/state/cycle

# 5. Configuracion inicial del proveedor IA
cat > ~/.workflow/config/providers.cfg << 'EOF'
AI_PROVIDER_DEV=opencode
AI_PROVIDER_CHAT=opencode
AI_FALLBACK=true
EOF

# 6. Perfil por defecto
cat > ~/.workflow/profile/default.yml << 'EOF'
user:
  name: "developer"
  style:
    language: es
    docsFirst: true
    requiresChangelogBeforePush: true
    prefersDryRun: true
EOF

# 7. Alias para acceso rapido (opcional)
echo 'alias wf="~/tienda-online/workflow.sh"' >> ~/.bashrc

# 8. Verificar instalacion
./workflow.sh status
```

### 7.3 Post-bootstrap

```bash
# Verificar estado
workflow.sh status

# Activar daemon como servicio de usuario
workflow.sh daemon enable
workflow.sh daemon start

# Verificar que el daemon esta corriendo
workflow.sh daemon status

# Probar el bot
workflow.sh bot "Hola, soy tu nuevo sistema operativo"
```

---

## 8. Systemd integration

### 8.1 Servicio de usuario

```ini
# ~/.config/systemd/user/workflow-daemon.service
[Unit]
Description=workflow.sh Prompt OS Daemon
Documentation=https://github.com/Jairdeveloper/Tienda-online
After=network.target

[Service]
Type=simple
ExecStart=%h/tienda-online/workflow.sh daemon listen
Restart=on-failure
RestartSec=5
StandardOutput=append:%h/.workflow/log/daemon.log
StandardError=append:%h/.workflow/log/daemon.log

[Install]
WantedBy=default.target
```

### 8.2 Timer para tareas programadas

```ini
# ~/.config/systemd/user/workflow-scheduler.service
[Unit]
Description=workflow.sh Scheduled Task Runner

[Service]
Type=oneshot
ExecStart=%h/tienda-online/workflow.sh daemon listen --once
```

```ini
# ~/.config/systemd/user/workflow-scheduler.timer
[Unit]
Description=Run workflow.sh scheduler every 5 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

### 8.3 Comandos de gestion via workflow.sh

```bash
# El modo daemon gestiona los archivos anteriores automaticamente:
workflow.sh daemon enable    # Crea/activa el servicio systemd de usuario
workflow.sh daemon disable   # Desactiva el servicio
workflow.sh daemon start     # systemctl --user start workflow-daemon
workflow.sh daemon stop      # systemctl --user stop workflow-daemon
workflow.sh daemon status    # systemctl --user status workflow-daemon
workflow.sh daemon logs      # journalctl --user -u workflow-daemon -f
```

---

## 9. Roadmap de implementacion

### Fase 0 — Prompt OS Spec (Este documento)

| Entregable | Estado |
|------------|--------|
| Especificacion arquitectonica Prompt OS | ✅ Completado |
| Registro de ID en REGISTRO_IDS.md | ✅ Completado |

### Fase 1 — HTTP Server + Providers IA

| Entregable | Dependencias |
|------------|-------------|
| `apps/server/` con Express + rutas base | `workflow.sh bootstrap` |
| Endpoints: `POST /compile`, `POST /propose`, `POST /plan` | Fase 0 |
| Integracion con proveedores IA (opencode, OpenAI, Anthropic) | `~/.workflow/config/providers.cfg` |
| Fallback automatico entre proveedores | Fase 1 |
| Tests del HTTP server | Fase 1 |

### Fase 2 — Prompt Compiler

| Entregable | Dependencias |
|------------|-------------|
| Modo `compile` con pipeline LEX → PARSE → SEMANTIC | Fase 1 |
| Tokenizador simple por palabras clave | Fase 2 |
| Gramatica BNF para parser | Fase 2 |
| IR JSON canonico (`~/.workflow/ir/cycle_N_IR.json`) | Fase 2 |
| Tabla de simbolos (`~/.workflow/symbols/`) | Fase 2 |
| Traza de tres direcciones (`cycle_N_TAC.ir`) | Fase 2 |
| Modo `predict` para predecir accion mas probable | Fase 2 |
| Modo `synthesize` para generar output desde IR | Fase 2 |

### Fase 3 — Bot + Training

| Entregable | Dependencias |
|------------|-------------|
| Modo `bot` para consultar al asistente | Fase 1 |
| Modo `train` para registrar ejemplos | Fase 2 |
| Sistema de scoring multi-factor | Fase 2 |
| 20+ ejemplos de entrenamiento precargados | Fase 3 |
| Perfil de usuario (`~/.workflow/profile/`) | Fase 3 |
| Deteccion de patrones de aprobacion/rechazo | Fase 3 |

### Fase 4 — System modes

| Entregable | Dependencias |
|------------|-------------|
| `pkg` — Gestion de paquetes y modulos Prompt OS | Fase 1 |
| `daemon` — Systemd wrapper y servicio de usuario | Fase 1 |
| `config` — Gestion de configuracion del OS | Fase 1 |
| `schedule` — Tareas programadas con systemd-timers | Fase 4 |
| `help` — Sistema de ayuda contextual | Fase 4 |

### Fase 5 — Arch wrappers

| Entregable | Dependencias |
|------------|-------------|
| `net` — NetworkManager wrapper (WiFi, status, scan) | Fase 4 |
| `audio` — Pipewire/PulseAudio wrapper | Fase 4 |
| `bt` — Bluetooth wrapper | Fase 4 |
| `container` — Docker/Podman wrapper | Fase 4 |
| `backup` — Sistema de respaldos | Fase 4 |
| `monitor` — Monitoreo del sistema | Fase 4 |

### Fase 6 — Bootstrapper

| Entregable | Dependencias |
|------------|-------------|
| `workflow.sh bootstrap` — Instalador completo para Arch | Fase 5 |
| Script `install.sh` independiente | Fase 6 |
| Deteccion de entorno (Arch, derivados, otros) | Fase 6 |
| Instalacion de dependencias del sistema | Fase 6 |
| Creacion de estructura `~/.workflow/` | Fase 6 |
| Configuracion inicial de proveedores IA | Fase 6 |
| Alias de shell para `wf` | Fase 6 |

### Fase 7 — TUI (Ink/React)

| Entregable | Dependencias |
|------------|-------------|
| `apps/tui/` con Ink + React + TypeScript | Fase 1 |
| Panel de estado del sistema | Fase 7 |
| Vista de inbox/outbox | Fase 7 |
| Editor de instrucciones | Fase 7 |
| Visor de resultados y logs | Fase 7 |
| Integracion con HTTP server | Fase 7 |

### Fase 8 — PromptFS completo

| Entregable | Dependencias |
|------------|-------------|
| Todos los directorios de `~/.workflow/` implementados | Fase 6 |
| Validacion de estructura al iniciar | Fase 8 |
| Comandos `workflow.sh fs <action>` para gestion | Fase 8 |
| Cleanup automatico de tmp/ | Fase 8 |
| Cuotas de disco para outbox/ | Fase 8 |

### Fase 9 — Plugins

| Entregable | Dependencias |
|------------|-------------|
| Sistema de modulos instalables (`~/.workflow/modules/`) | Fase 4 |
| Registro central de modulos | Fase 9 |
| `workflow.sh pkg search` en registro remoto | Fase 9 |
| API de plugins con hooks | Fase 9 |
| Marketplace CLI para compartir modos | Fase 9 |

### Fase 10 — Auto-aprendizaje

| Entregable | Dependencias |
|------------|-------------|
| Entrenamiento continuo basado en acciones del usuario | Fase 3 |
| Ajuste automatico de pesos `w1..w6` en scoring | Fase 10 |
| Deteccion de cambios en preferencias del usuario | Fase 10 |
| Sugerencias proactivas basadas en contexto | Fase 10 |
| Reportes semanales de productividad | Fase 10 |

### Diagrama de dependencias entre fases

```
Fase 0 (Spec)
  │
  ▼
Fase 1 (HTTP + Providers) ──────────────────────┐
  │                                               │
  ├──► Fase 2 (Compiler) ──► Fase 3 (Bot+Training) │
  │         │                      │              │
  │         ▼                      ▼              │
  │    Fase 4 (System modes)       │              │
  │         │                      │              │
  │         ▼                      ▼              │
  │    Fase 5 (Arch wrappers)      │              │
  │         │                      │              │
  │         ▼                      ▼              │
  │    Fase 6 (Bootstrapper) ──────┤              │
  │         │                                   │
  │         ▼                                   │
  │    Fase 7 (TUI)                             │
  │         │                                   │
  │         ▼                                   │
  │    Fase 8 (PromptFS completo)               │
  │         │                                   │
  │         ▼                                   │
  │    Fase 9 (Plugins)                         │
  │         │                                   │
  │         ▼                                   │
  │    Fase 10 (Auto-aprendizaje) ◄──────────────┘
  └─────────────────────────────────────────────┘
```

---

## 10. Integracion con el ecosistema existente

### 10.1 Documentos relacionados

| Documento | Relacion |
|-----------|----------|
| `workflow/020_DEV_WORKFLOW_1_0_DRAFT.md` | Documentacion base de workflow.sh |
| `workflow/025_DEV_REFERENCE_WORKFLOW_1_0_DRAFT.md` | Referencia completa del script |
| `workflow/031_DEV_SPEC_WORKFLOW_BOT_AGENT_1_0_DRAFT.md` | Bot agent sobre workflow.sh |
| `workflow/032_DEV_SPEC_PROMPT_COMPILER_WORKFLOW_1_0_DRAFT.md` | Compilador de prompts |
| `workflow/034_EXEC_PLAN_PROMPT_COMPILER_1_0_DRAFT.md` | Plan de implementacion del compilador |
| `algoritmos/044_DEV_GUIDE_SHELL_STYLE_1_0_DRAFT.md` | Guia de estilo Shell para modos |
| `.opencode/agents/workflow-agent.md` | Agente orquestador del ecosistema |

### 10.2 Principios de diseno

1. **Backwards compatibility**: todos los modos actuales de `workflow.sh`
   deben seguir funcionando. Los nuevos modos se anaden sin romper los
   existentes.

2. **Opt-in**: los modos de sistema (net, audio, bt, etc.) solo se activan
   cuando el usuario los instala via `pkg install`. No se asume que todos
   los usuarios quieran todos los modos.

3. **Fail gracefully**: si una herramienta de Arch no esta instalada
   (ej. `bluetoothctl`), el modo debe mostrar un mensaje claro y sugerir
   la instalacion del paquete necesario.

4. **Everything is a file**: todos los modos, configuracion, estado y
   resultados son archivos. Nada se almacena solo en memoria.

5. **Dry-run first**: todo comando destructivo debe poderse ensayar con
   `DRY_RUN=true` antes de ejecucion real.

6. **No ejecutar Node.js automaticamente**: el Prompt OS hereda la
   restriccion de no ejecutar `npm`, `node`, `prisma` o `jest` sin
   aprobacion explicita del usuario.

---

## 11. Glosario

| Termino | Definicion |
|---------|------------|
| **Prompt OS** | Capa de abstraccion sobre Arch Linux donde workflow.sh es el nucleo |
| **PromptFS** | Sistema de archivos virtual basado en `~/.workflow/` |
| **Prompt Compiler** | Pipeline que transforma lenguaje natural a acciones del sistema |
| **IR (Intermediate Representation)** | Representacion intermedia canonica en JSON de una instruccion compilada |
| **Modo** | Subsistema funcional del Prompt OS (dev, system, network, etc.) |
| **Modulo** | Paquete instalable que anade uno o mas modos al sistema |
| **Kernel** | workflow.sh como nucleo orquestador del Prompt OS |
| **Daemon** | Servicio en background que monitorea inbox y ejecuta instrucciones |
| **TAC (Three Address Code)** | Codigo de tres direcciones para traza de decision del compilador |
| **Training** | Datos de entrenamiento que mejoran las predicciones del sistema |
| **Profile** | Perfil de usuario con preferencias, historial y patrones |
| **Bootstrap** | Proceso de instalacion inicial del Prompt OS en Arch Linux |
| **Wrapper** | Capa que unifica la interfaz de una herramienta Arch bajo workflow.sh |
