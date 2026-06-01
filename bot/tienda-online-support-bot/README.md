# Tienda Online Support Bot

Base Python para recrear el algoritmo definido en:

`docs/ai/bot/004_CHATBOT_ALGORITHM_TIENDA_ONLINE_ACTIVE.md`

## Objetivo

Implementar un chatbot de soporte B2B para la tienda online con:

- estado conversacional por `session_id`;
- resolucion de usuario desde `Authorization`;
- normalizacion, tokenizacion y extraccion de entidades;
- clasificacion de intents por reglas;
- validacion de autenticacion, roles y permisos;
- recuperacion de contexto desde conocimiento local o herramientas simuladas;
- confirmacion obligatoria para acciones de escritura;
- respuesta serializable con `reply`, `intent`, `sources` y `requestId`.

## Uso local

```sh
python bot/tienda-online-support-bot/main.py "buscar producto SKU ABC-1"
python bot/tienda-online-support-bot/main.py "actualizar inventario ABC-1 a 20" --auth demo-admin
python bot/tienda-online-support-bot/main.py "confirmo" --auth demo-admin --confirm
```

No usa dependencias externas.

## Entorno virtual

El entorno virtual local esta en:

```sh
bot/tienda-online-support-bot/.venv
```

Activacion desde la raiz del repositorio:

```sh
source bot/tienda-online-support-bot/.venv/bin/activate
python bot/tienda-online-support-bot/main.py "buscar producto SKU ABC-1"
deactivate
```

Tambien puede ejecutarse sin activar:

```sh
bot/tienda-online-support-bot/.venv/bin/python bot/tienda-online-support-bot/main.py "buscar producto SKU ABC-1"
```

Nota: el sistema no tiene `ensurepip`, por lo que el entorno actual no incluye `pip`. Para habilitar instalacion de dependencias dentro del venv, instalar primero el paquete del sistema `python3.12-venv` y recrear `.venv`.
