# gomcp - Configuración Interactiva de MCP para Claude Code

<div align="center">

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh.md) | [Español](README.es.md)

</div>

[![npm version](https://badge.fury.io/js/gomcp.svg)](https://badge.fury.io/js/gomcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/gomcp.svg)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com)

> 🚀 **¡Go MCP!** - De cero a superpoderes de IA en 30 segundos. Elige tus herramientas, nosotros nos encargamos del resto.

## Tabla de Contenidos

- [gomcp - Configuración Interactiva de MCP para Claude Code](#gomcp---configuración-interactiva-de-mcp-para-claude-code)
    - [Tabla de Contenidos](#tabla-de-contenidos)
    - [Características](#características)
    - [Inicio Rápido](#inicio-rápido)
    - [Instalación](#instalación)
        - [Usando npm](#usando-npm)
        - [Usando yarn](#usando-yarn)
        - [Usando pnpm](#usando-pnpm)
        - [Requisitos](#requisitos)
    - [Uso](#uso)
        - [Modo Interactivo](#modo-interactivo)
        - [Respaldo y Restauración](#respaldo-y-restauración)
        - [Opciones de Línea de Comandos](#opciones-de-línea-de-comandos)
        - [Ámbitos de Instalación](#ámbitos-de-instalación)
            - [Usuario (Global)](#usuario-global)
            - [Proyecto](#proyecto)
        - [Servidores MCP Solo para Proyecto vs Nivel de Usuario](#servidores-mcp-solo-para-proyecto-vs-nivel-de-usuario)
            - [🔒 Servidores Solo para Proyecto](#-servidores-solo-para-proyecto)
            - [📁 Servidores con Preferencia de Proyecto](#-servidores-con-preferencia-de-proyecto)
            - [👤 Servidores con Preferencia de Usuario](#-servidores-con-preferencia-de-usuario)
    - [Servidores MCP Disponibles](#servidores-mcp-disponibles)
        - [Esenciales](#esenciales)
        - [Desarrollo](#desarrollo)
        - [Productividad](#productividad)
        - [Datos y Análisis](#datos-y-análisis)
        - [Búsqueda y Web](#búsqueda-y-web)
        - [Automatización e Integración](#automatización-e-integración)
        - [IA y ML](#ia-y-ml)
        - [DevOps e Infraestructura](#devops-e-infraestructura)
        - [Dominio y Seguridad](#dominio-y-seguridad)
        - [Blockchain y Cripto](#blockchain-y-cripto)
        - [Trabajo y Carrera](#trabajo-y-carrera)
        - [Tiempo y Utilidades](#tiempo-y-utilidades)
        - [Meta Herramientas](#meta-herramientas)
        - [Y muchos más...](#y-muchos-más)
    - [Presets](#presets)
    - [Configuración](#configuración)
        - [Configuración del Servidor](#configuración-del-servidor)
        - [Acceso al Sistema de Archivos](#acceso-al-sistema-de-archivos)
        - [Archivos de Configuración](#archivos-de-configuración)
    - [Estructura del Proyecto](#estructura-del-proyecto)
    - [Desarrollo](#desarrollo-1)
        - [Configuración](#configuración-1)
        - [Arquitectura](#arquitectura)
    - [Pruebas](#pruebas)
        - [Estructura de Pruebas](#estructura-de-pruebas)
    - [Colaboración en Equipo](#colaboración-en-equipo)
        - [Configurando Servidores de Proyecto](#configurando-servidores-de-proyecto)
        - [Para Miembros del Equipo](#para-miembros-del-equipo)
        - [Mejores Prácticas](#mejores-prácticas)
    - [Contribuyendo](#contribuyendo)
        - [Inicio Rápido para Contribuidores](#inicio-rápido-para-contribuidores)
        - [Directrices de Desarrollo](#directrices-de-desarrollo)
    - [Hoja de Ruta](#hoja-de-ruta)
    - [Preguntas Frecuentes](#preguntas-frecuentes)
    - [Licencia](#licencia)
    - [Agradecimientos](#agradecimientos)

## Características

- 📦 **Instalación Interactiva**: Selecciona servidores MCP con una interfaz de casillas amigable
- 🎯 **Categorización Inteligente**: Servidores organizados por categoría (Esenciales, Desarrollo, Productividad, etc.)
- ⚡ **Presets Rápidos**: Instala combinaciones comunes de servidores con un comando
- 🔧 **Configuración Automática**: Configuración guiada para servidores que requieren claves API o ajustes
- ✅ **Verificación**: Verifica el estado de los servidores MCP instalados
- 💾 **Respaldo/Restauración**: Guarda y restaura tus configuraciones MCP
- 🌍 **Soporte Multi-ámbito**: Instala globalmente o por proyecto
- 🔄 **Gestión de Actualizaciones**: Mantén tus servidores MCP actualizados

## Inicio Rápido

```bash
# Ejecutar directamente con npx (recomendado)
npx gomcp

# O instalar globalmente
npm install -g gomcp
gomcp
```

## Instalación

### Usando npm

```bash
npm install -g gomcp
```

### Usando yarn

```bash
yarn global add gomcp
```

### Usando pnpm

```bash
pnpm add -g gomcp
```

### Requisitos

- Node.js >= 16.0.0
- Claude Code instalado y accesible en PATH
- Git (para algunos servidores MCP)

## Uso

### Modo Interactivo

Simplemente ejecuta `gomcp` para iniciar el menú interactivo:

```bash
gomcp
```

Verás un menú interactivo con opciones para:
- 🆕 Instalar nuevos servidores (con selección de ámbito)
- 🔄 Actualizar servidores existentes
- ✅ Verificar instalaciones
- 💾 Respaldar/restaurar configuraciones
- 📋 Listar servidores disponibles

### Respaldo y Restauración

gomcp proporciona opciones flexibles de respaldo y restauración:

**Opciones de Respaldo:**
- 👤 **Solo configuración de usuario** - Respalda ajustes MCP globales (~/.claude/config.json)
- 📁 **Solo configuración de proyecto** - Respalda ajustes específicos del proyecto (.mcp.json)
- 💾 **Todas las configuraciones** - Respalda tanto ajustes de usuario como de proyecto

**Opciones de Restauración:**
- Detecta automáticamente el tipo de respaldo y restaura en consecuencia
- Opción para restaurar tipos de configuración específicos
- Crea respaldos de configuraciones existentes antes de restaurar

**Nomenclatura de Archivos de Respaldo:**
- Respaldos de usuario: `mcp-user-backup-{marca-de-tiempo}.json`
- Respaldos de proyecto: `mcp-project-backup-{marca-de-tiempo}.json`
- Respaldos completos: `mcp-backup-{marca-de-tiempo}.json`

### Opciones de Línea de Comandos

```bash
# Instalar con diferentes ámbitos
gomcp                       # Modo interactivo (solicita el ámbito)
gomcp --scope user          # Instalar globalmente (predeterminado)
gomcp --scope project       # Instalar solo para el proyecto actual

# Instalar una colección preset
gomcp --preset recommended  # GitHub, Sistema de Archivos, Pensamiento Secuencial
gomcp --preset dev          # Preset de herramientas de desarrollo
gomcp --preset data         # Preset de análisis de datos

# Instalar preset con ámbito específico
gomcp --preset dev --scope project  # Instalar preset dev solo para proyecto

# Listar todos los servidores disponibles
gomcp --list

# Verificar servidores instalados
gomcp --verify

# Mostrar versión
gomcp --version

# Mostrar ayuda
gomcp --help
```

### Ámbitos de Instalación

#### Usuario (Global)
- Los servidores están disponibles en todos tus proyectos
- Usa `--scope user` o selecciona "Usuario" en modo interactivo
- Este es el ámbito predeterminado
- Ubicación de configuración: `~/.claude/mcp.json`
- Mejor para: Herramientas de propósito general (GitHub, Sistema de Archivos, Context7)

#### Proyecto
- Los servidores solo están disponibles en el proyecto actual
- Usa `--scope project` o selecciona "Proyecto" en modo interactivo
- Crea tanto `.mcp.json` (para compartir con el equipo) y activa en Claude Code
- Ubicación de configuración: `./.mcp.json` (raíz del proyecto)
- Mejor para: Herramientas específicas del proyecto (Serena, Memory Bank, conexiones de base de datos)

**Cómo Funciona el Ámbito de Proyecto:**
1. Crea/actualiza `.mcp.json` en la raíz de tu proyecto
2. También ejecuta `claude mcp add -s project` para activación inmediata
3. Los miembros del equipo que clonen el proyecto verán el `.mcp.json` y pueden aprobar los servidores
4. Usa `claude mcp reset-project-choices` para restablecer las decisiones de aprobación

### Servidores MCP Solo para Proyecto vs Nivel de Usuario

Algunos servidores MCP están diseñados para funcionar mejor (o exclusivamente) a nivel de proyecto:

#### 🔒 Servidores Solo para Proyecto
Estos servidores **deben** instalarse a nivel de proyecto:
- **Serena**: Mantiene memoria y contexto de código específicos del proyecto
- **Memory Bank**: Almacena memoria persistente por proyecto

#### 📁 Servidores con Preferencia de Proyecto
Estos servidores funcionan mejor a nivel de proyecto pero pueden instalarse globalmente con `--force`:
- **PostgreSQL**: Las conexiones de base de datos deben ser específicas del proyecto
- **Supabase**: Cada proyecto típicamente usa su propia instancia de Supabase
- **Jupyter**: Los entornos virtuales y dependencias son específicos del proyecto

#### 👤 Servidores con Preferencia de Usuario
Estos servidores funcionan mejor a nivel de usuario por conveniencia:
- **GitHub**: Usa el mismo token de GitHub en todos los proyectos
- **Sistema de Archivos**: Accede a directorios comunes desde cualquier proyecto
- **Context7**: La búsqueda de documentación funciona igual en todas partes

Cuando instales un servidor en un ámbito no recomendado, gomcp te advertirá sobre posibles problemas. Usa la bandera `--force` para anular estas advertencias si entiendes las implicaciones.

## Servidores MCP Disponibles

### Esenciales
- 🧠 **Pensamiento Secuencial** - Desglosa tareas complejas en pasos lógicos
- 🛠️ **Serena** - Poderoso kit de herramientas de agente de codificación con recuperación y edición semántica
- 📚 **Context7** - Accede a documentación actualizada y ejemplos de código para bibliotecas
- 🐙 **GitHub** - Conéctate a la API de GitHub para issues, PRs y CI/CD
- 📁 **Sistema de Archivos** - Lee y escribe archivos en tu máquina

### Desarrollo
- 🐘 **PostgreSQL** - Consulta bases de datos PostgreSQL con lenguaje natural
- 🌐 **Puppeteer** - Automatiza interacciones y pruebas del navegador web
- 🎭 **Playwright** - Automatización multi-navegador con árbol de accesibilidad
- 🐳 **Docker** - Gestiona contenedores, imágenes y flujos de trabajo Docker
- 🔧 **Herramientas del Navegador** - Monitorea registros del navegador y automatiza tareas
- 🌐 **Chrome** - Controla Chrome con más de 20 herramientas para automatización
- 🎨 **Figma** - Integración de flujo de trabajo diseño-a-código
- 🍃 **Supabase** - Gestiona bases de datos y autenticación Supabase

### Productividad
- 💬 **Slack** - Integra con Slack para comunicación del equipo
- 📝 **Notion** - Accede y gestiona espacios de trabajo Notion
- 💾 **Memory Bank** - Memoria persistente entre sesiones de Claude
- 📧 **Email** - Envía correos y gestiona adjuntos
- 📊 **Google Suite** - Accede a Google Docs, Sheets y Drive
- 📈 **Excel** - Crea y modifica archivos Excel

### Datos y Análisis
- 📊 **Jupyter** - Ejecuta código en notebooks Jupyter
- 🔬 **Everything Search** - Búsqueda rápida de archivos en sistemas operativos
- 🌍 **EVM** - Servicios blockchain completos para más de 30 redes EVM
- 🔑 **Redis** - Operaciones de base de datos y microservicio de caché

### Búsqueda y Web
- 🦆 **DuckDuckGo** - Búsqueda web centrada en privacidad sin claves API
- 🦁 **Brave Search** - Búsqueda web centrada en privacidad con API
- 📸 **Screenshot** - Captura capturas de pantalla de sitios web con características avanzadas

### Automatización e Integración
- ⚡ **Zapier** - Automatiza flujos de trabajo en más de 5,000 aplicaciones
- 💳 **Stripe** - Integra con APIs de pago Stripe
- 🎥 **YouTube** - Extrae metadatos y transcripciones de videos de YouTube
- 🔌 **Discord** - Automatización de bots para servidores Discord

### IA y ML
- 🤖 **Replicate** - Busca, ejecuta y gestiona modelos de aprendizaje automático
- 🧠 **Hyperbolic** - Interactúa con servicios en la nube GPU de Hyperbolic
- 📈 **Databricks** - Consultas SQL y gestión de trabajos para Databricks

### DevOps e Infraestructura
- ☸️ **Kubernetes (mcp-k8s-go)** - Explora pods, logs, eventos y espacios de nombres de Kubernetes
- 📊 **HAProxy** - Gestiona y monitorea configuraciones HAProxy
- 🌐 **Netbird** - Analiza peers, grupos y políticas de red Netbird
- 🔥 **OPNSense** - Gestión de firewall OPNSense y acceso API

### Dominio y Seguridad
- 🔍 **Domain Tools** - Análisis integral de dominios con WHOIS y DNS
- 📡 **Splunk** - Acceso a búsquedas guardadas, alertas e índices de Splunk

### Blockchain y Cripto
- 🟣 **Solana Agent Kit** - Interactúa con blockchain Solana (más de 40 acciones de protocolo)
- ⚡ **EVM** - Integración blockchain EVM multi-cadena

### Trabajo y Carrera
- 💼 **Reed Jobs** - Busca y recupera ofertas de trabajo de Reed.co.uk

### Tiempo y Utilidades
- ⏰ **Time** - Obtén la hora actual y convierte entre zonas horarias
- 🔧 **Everything** - Búsqueda rápida de archivos con características completas

### Meta Herramientas
- 🛠️ **MCP Compass** - Sugiere servidores MCP apropiados para necesidades específicas
- 🏗️ **MCP Server Creator** - Genera otros servidores MCP dinámicamente
- 📦 **MCP Installer** - Instala otros servidores MCP
- 🔄 **MCP Proxy** - Agrega múltiples servidores de recursos MCP

### Y muchos más...

Ejecuta `gomcp --list` para ver todos los servidores disponibles con descripciones.

## Presets

Instalación rápida de combinaciones comunes de servidores:

| Preset         | Servidores Incluidos                               | Caso de Uso                                   |
| -------------- | -------------------------------------------------- | --------------------------------------------- |
| `recommended`  | GitHub, Sistema de Archivos, Pensamiento Secuencial, Context7 | Comenzando con herramientas esenciales |
| `dev`          | Todos los recomendados + PostgreSQL, Docker, Puppeteer | Entorno de desarrollo completo       |
| `data`         | Jupyter, Excel, SciPy, PostgreSQL                  | Análisis y visualización de datos            |
| `web`          | Puppeteer, Sistema de Archivos, GitHub             | Desarrollo web y automatización              |
| `productivity` | Slack, Notion, Memory Bank, Email                  | Colaboración en equipo                       |

## Configuración

### Configuración del Servidor

Cuando instales servidores que requieren configuración (claves API, tokens, etc.), gomcp te guiará a través del proceso de configuración:

```
📝 Configurar GitHub:
? Token de Acceso Personal de GitHub: **********************
? Repositorio predeterminado (opcional): owner/repo
```

### Acceso al Sistema de Archivos

Para el servidor Sistema de Archivos, puedes seleccionar qué directorios puede acceder Claude:

```
? Selecciona directorios para permitir acceso: 
❯◉ ~/Documents
 ◉ ~/Projects
 ◯ ~/Desktop
 ◯ ~/Downloads
 ◯ Ruta personalizada...
```

### Archivos de Configuración

- **Configuración de usuario**: `~/.claude/config.json` - Configuración de Claude Code
- **Configuración de proyecto**: `./.mcp.json` - Servidores MCP específicos del proyecto
- **Respaldos**: Creados en el directorio actual con marca de tiempo

## Estructura del Proyecto

```
gomcp/
├── src/
│   ├── index.ts        # Punto de entrada CLI
│   ├── types.ts        # Definiciones de tipos TypeScript
│   ├── servers.ts      # Definiciones de servidores MCP
│   ├── installer.ts    # Lógica de instalación
│   ├── ui.ts          # Componentes de UI interactiva
│   └── config.ts      # Gestión de configuración
├── tests/             # Archivos de prueba
├── dist/              # JavaScript compilado
├── package.json
├── tsconfig.json
└── README.md
```

## Desarrollo

### Configuración

```bash
# Clonar el repositorio
git clone https://github.com/coolwithyou/gomcp.git
cd gomcp

# Instalar dependencias
npm install

# Compilar
npm run build

# Ejecutar en desarrollo
npm run dev
```

### Arquitectura

gomcp sigue una arquitectura modular:

- **Capa UI** (`ui.ts`): Maneja todas las interacciones del usuario usando Inquirer.js
- **Lógica de Negocio** (`installer.ts`): Funcionalidad principal para instalar/gestionar servidores
- **Capa de Datos** (`servers.ts`, `config.ts`): Definiciones de servidores y configuración
- **Seguridad de Tipos** (`types.ts`): Interfaces TypeScript para verificación de tipos

## Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

### Estructura de Pruebas

- **Pruebas Unitarias**: Prueban funciones y módulos individuales
- **Pruebas de Integración**: Prueban interacciones entre módulos
- **Pruebas E2E**: Prueban flujos de trabajo completos del usuario

## Colaboración en Equipo

Cuando trabajas en equipo, los servidores MCP con ámbito de proyecto permiten colaboración fluida:

### Configurando Servidores de Proyecto

1. **Instalar servidores con ámbito de proyecto:**
   ```bash
   gomcp --scope project
   # O selecciona "Proyecto" en modo interactivo
   ```

2. **Hacer commit del archivo `.mcp.json`:**
   ```bash
   git add .mcp.json
   git commit -m "Agregar configuración de servidores MCP del proyecto"
   ```

### Para Miembros del Equipo

Cuando clones un proyecto con `.mcp.json`:

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd <directorio-del-proyecto>
   ```

2. **Iniciar Claude Code:**
   ```bash
   claude
   ```

3. **Aprobar servidores del proyecto:**
   - Claude Code te pedirá aprobar los servidores MCP del proyecto
   - Revisa los servidores y aprueba si son esperados
   - Usa `/mcp` para verificar que los servidores están conectados

4. **Restablecer aprobaciones si es necesario:**
   ```bash
   claude mcp reset-project-choices
   ```

### Mejores Prácticas

- Solo hacer commit de `.mcp.json`, no del directorio `.claude/`
- Documentar variables de entorno requeridas en tu README
- Usar ámbito de proyecto para:
  - Bases de datos de desarrollo
  - Memoria IA específica del proyecto (Serena, Memory Bank)
  - Conexiones API específicas del proyecto
- Usar ámbito de usuario para:
  - Herramientas personales (GitHub con tu token)
  - Utilidades generales (Sistema de Archivos, Context7)

## Contribuyendo

¡Damos la bienvenida a las contribuciones! Por favor consulta nuestra [Guía de Contribución](CONTRIBUTING.md) para más detalles.

### Inicio Rápido para Contribuidores

1. Haz fork del repositorio
2. Crea tu rama de característica (`git checkout -b feature/caracteristica-asombrosa`)
3. Confirma tus cambios (`git commit -m 'Agregar característica asombrosa'`)
4. Empuja a la rama (`git push origin feature/caracteristica-asombrosa`)
5. Abre un Pull Request

### Directrices de Desarrollo

- Escribe pruebas para nuevas características
- Sigue el estilo de código existente
- Actualiza la documentación según sea necesario
- Agrégarte a la lista de contribuidores

## Hoja de Ruta

- [ ] Sistema de plugins para servidores MCP personalizados
- [ ] UI de configuración basada en web
- [ ] Monitoreo de salud del servidor
- [ ] Actualizaciones automáticas del servidor
- [ ] Plantillas de configuración
- [ ] Soporte multi-idioma
- [ ] Herramientas de perfilado de rendimiento
- [ ] Gestión de dependencias del servidor

Consulta los [issues abiertos](https://github.com/coolwithyou/gomcp/issues) para una lista completa de características propuestas y problemas conocidos.

## Preguntas Frecuentes

**P: ¿Qué es MCP (Model Context Protocol)?**
R: MCP es un protocolo que permite a Claude interactuar con herramientas y servicios externos, extendiendo sus capacidades más allá de la generación de texto.

**P: ¿Cómo actualizo gomcp?**
R: Ejecuta `npm update -g gomcp` o usa el comando de actualización de tu gestor de paquetes.

**P: ¿Puedo usar gomcp sin Claude Code?**
R: No, gomcp está específicamente diseñado para funcionar con la implementación MCP de Claude Code.

**P: ¿Cómo desinstalo un servidor MCP?**
R: Usa el modo interactivo y selecciona "Actualizar servidores existentes", luego desmarca los servidores que quieres eliminar.

**P: ¿Dónde se almacenan mis claves API?**
R: Las claves API se almacenan en el archivo de configuración MCP (`~/.claude/mcp.json`) con permisos de archivo apropiados.

**P: ¿Puedo crear presets personalizados?**
R: ¡Sí! Puedes guardar tu configuración actual como un preset personalizado a través del menú interactivo.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles.

## Agradecimientos

- El equipo de Claude Code en Anthropic por crear MCP
- Todos los autores y contribuidores de servidores MCP
- La comunidad de código abierto por sus comentarios y contribuciones

---

<p align="center">
  Hecho con ❤️ para la comunidad de Claude Code
</p>

<p align="center">
  <a href="https://github.com/coolwithyou/gomcp/issues/new?assignees=&labels=bug&template=bug_report.md&title=">Reportar Error</a>
  ·
  <a href="https://github.com/coolwithyou/gomcp/issues/new?assignees=&labels=enhancement&template=feature_request.md&title=">Solicitar Característica</a>
  ·
  <a href="https://github.com/coolwithyou/gomcp/discussions">Unirse a la Discusión</a>
</p>