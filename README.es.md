# gomcp

![gomcp](gomcp.png)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh.md) | [Español](README.es.md)

[![npm version](https://badge.fury.io/js/gomcp.svg)](https://badge.fury.io/js/gomcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Una forma sencilla de configurar servidores MCP para Claude Code. Elige las herramientas que necesitas y nosotros nos encargamos del resto.

## Inicio Rápido

## Inicio Rápido

```bash
# Solo ejecuta esto:
npx gomcp

# O si prefieres instalarlo globalmente:
npm install -g gomcp
gomcp
```

¡Listo! El menú interactivo te guiará en todo.

## ¿Qué es esto?

Si usas Claude Code, probablemente quieras conectarlo a varias herramientas (llamadas servidores MCP) - cosas como GitHub, acceso al sistema de archivos, bases de datos, etc. Configurar todo esto manualmente es un poco tedioso. Esta herramienta lo hace fácil.

## Características

- Menú interactivo para elegir qué servidores quieres
- Maneja toda la instalación y configuración
- Soporta instalaciones globales y por proyecto
- Respalda y restaura tus configuraciones
- Funciona con npm, yarn o pnpm

## Instalación

Realmente no necesitas instalarlo. Solo usa:
```bash
npx gomcp
```

Pero si lo quieres globalmente:
```bash
npm install -g gomcp
# o yarn global add gomcp
# o pnpm add -g gomcp
```

Requisitos: Node.js 16+ y Claude Code instalado.

## Cómo Usar

### Modo Interactivo (Recomendado)

Solo ejecuta:
```bash
gomcp
```

Tendrás un menú donde puedes:
- Instalar nuevos servidores
- Actualizar los existentes
- Verificar qué está instalado
- Respaldar/restaurar configuraciones
- Cambiar idioma (soporta español, inglés, coreano, japonés, chino)

### Opciones de Línea de Comandos

Si sabes lo que quieres:
```bash
# Instalar un preset
gomcp --preset recommended  # Empieza con lo básico
gomcp --preset dev         # Para trabajo de desarrollo
gomcp --preset data        # Para análisis de datos

# Otros comandos útiles
gomcp --list               # Ver todos los servidores disponibles
gomcp --verify             # Revisar qué está instalado
gomcp --scope project      # Instalar solo para el proyecto actual
```

### Ámbitos de Instalación

**Usuario (Global)** - Por defecto. Los servidores funcionan en todos tus proyectos.

**Proyecto** - Solo para el proyecto actual. Bueno para colaboración en equipo porque crea un archivo `.mcp.json` que puedes commitear. Cuando los compañeros clonen el repo, Claude Code les pedirá aprobar los servidores.


## Servidores Disponibles

Tenemos un montón de servidores MCP organizados por categoría. Aquí algunos populares:

**Herramientas Esenciales**
- GitHub - Trabaja con repos, issues, PRs
- Sistema de Archivos - Lee/escribe archivos localmente
- Context7 - Obtén docs para cualquier librería
- Sequential Thinking - Divide tareas complejas
- Serena - Asistente inteligente para edición de código

**Desarrollo**
- PostgreSQL, Docker, Puppeteer, Supabase

**Productividad**
- Slack, Notion, Memory (grafo de conocimiento)

**Herramientas AWS**
- Todo desde CDK hasta Lambda y RDS

...y muchos más. Ejecuta `gomcp --list` para verlos todos.

## Presets

¿No quieres elegir servidores uno por uno? Tenemos presets:

- `recommended` - Lo básico para empezar
- `dev` - Configuración completa de desarrollo
- `data` - Para análisis de datos
- `web` - Herramientas de desarrollo web
- `productivity` - Colaboración en equipo
- `aws` - Desarrollo AWS

## Configuración

Cuando un servidor necesite claves API o configuración, te preguntaremos durante la instalación. Por ejemplo, GitHub te pedirá tu token de acceso personal.

Para el servidor de Sistema de Archivos, elegirás qué directorios puede acceder Claude. Bastante directo.

Los archivos de configuración viven en:
- `~/.claude/config.json` (configuración de usuario)
- `./.mcp.json` (configuración de proyecto)

## Colaboración en Equipo

¿Trabajando en equipo? Usa el ámbito de proyecto:

1. Instala servidores: `gomcp --scope project`
2. Commitea el archivo `.mcp.json`
3. Cuando los compañeros clonen el repo y ejecuten `claude`, se les pedirá aprobar los servidores

Así de simple. Todos tienen la misma configuración.

## Desarrollo

¿Quieres contribuir?

```bash
git clone https://github.com/coolwithyou/gomcp.git
cd gomcp
npm install
npm run build
npm test
```

El código es bastante directo - TypeScript, usa Inquirer para la UI, y sigue prácticas estándar de npm.

## Contribuyendo

Siéntete libre de contribuir. Solo haz un fork, haz tus cambios y envía un PR. Somos bastante relajados con las contribuciones - solo asegúrate de que pasen las pruebas.

## FAQ

**¿Qué es MCP?**  
Es el protocolo que permite a Claude Code conectarse a herramientas externas.

**¿Cómo actualizo gomcp?**  
`npm update -g gomcp`

**¿Puedo usar esto sin Claude Code?**  
No, es específicamente para Claude Code.

**¿Cómo quito un servidor?**  
Ejecuta gomcp, ve a "Actualizar servidores existentes" y desmarca lo que no quieras.

## Licencia

MIT - haz lo que quieras con esto.

---

Gracias al equipo de Claude Code por MCP y a todos los que han contribuido a los diversos servidores MCP. Son geniales.

[Reportar bugs](https://github.com/coolwithyou/gomcp/issues) | [Solicitar características](https://github.com/coolwithyou/gomcp/issues) | [Discusiones](https://github.com/coolwithyou/gomcp/discussions)