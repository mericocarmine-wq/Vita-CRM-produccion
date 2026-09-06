# Vita. f2f

**Aplicación de productividad multi-rol para equipos de captación de socios.**

Vita. f2f es una aplicación de productividad multi-rol desplegada en producción y actualmente en uso por un cliente real bajo dominio propio. El producto combina gestión de tareas, inteligencia operativa y administración de usuarios bajo una arquitectura de permisos jerárquica de tres niveles: administrador, jefe de equipo y captador.

---

## Visión general

Esta aplicación ha sido concebida como un sistema operativo ligero para organizaciones de captación. Cada módulo responde a una necesidad real del flujo de trabajo: planificar tareas, medir resultados, gestionar equipos y mantener el control administrativo sin fricción.

La arquitectura de permisos se refleja de extremo a extremo, desde la interfaz hasta las políticas de acceso del backend. El diseño sigue una estética limpia y corporativa, con identidad visual propia, tipografía serif para titulares y una interfaz centrada en la claridad operativa.

**Estado:** en producción, con cliente activo en dominio propio.

---

## Stack tecnológico

- **Frontend:** React 18, TypeScript 5, Vite 5, Tailwind CSS v3
- **Gestión de estado y datos:** TanStack Query
- **Backend, base de datos y autenticación:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Funciones serverless:** Edge Functions
- **Visualización de datos:** Recharts
- **Iconografía:** Lucide React
- **Despliegue:** producción bajo dominio propio

---

## Arquitectura y filosofía de diseño

La arquitectura prioriza la seguridad por diseño y la separación de responsabilidades:

- **Autenticación robusta:** gestión de sesiones, perfiles y roles desacoplada.
- **Control de acceso basado en roles:** separación estricta de tres niveles entre administradores, jefes de equipo y captadores.
- **Componentes reutilizables:** diálogos, tablas, gráficos y formularios compartidos entre módulos.
- **UX coherente:** navegación por sidebar, indicadores visuales de estado y alertas contextuales.

---

## Módulos principales

### 1. Panel de Tareas

Gestión completa del ciclo de vida de las tareas:

- **Vista Kanban:** columnas *Pendiente*, *En curso* y *Realizada*.
- **Drag & drop:** cambio de estado arrastrando tarjetas.
- **Visibilidad inteligente:** tareas *privadas* (azul) y *de equipo* (púrpura).
- **Fecha de caducidad:** cada tarea puede incluir fecha y hora límite.
- **Alertas temporales:** indicadores de color según proximidad de vencimiento.
- **Permisos diferenciados:** los administradores pueden editar y eliminar cualquier tarea; los usuarios estándar solo gestionan las suyas.

### 2. Resultados de Equipo

Módulo de inteligencia operativa para la captación de socios:

- **Dashboard global:** KPIs, evolución diaria, ranking de equipos y captadores en tiempo real.
- **Vista por equipo:** rendimiento detallado bajo cada jefe de equipo.
- **Vista por captador:** seguimiento individual de socios captados y tendencias.
- **Sistema de objetivos:** metas diarias, semanales y mensuales por equipo e individuo.
- **Filtros avanzados:** rango de fechas, equipo y captador.
- **Exportación CSV:** descarga de resultados filtrados.
- **Alertas inteligentes:** detección de equipos o captadores por debajo del objetivo.

### 3. Administración de Usuarios

Panel de control para la gestión completa de la organización:

- **Usuarios pendientes:** detección automática de registros nuevos pendientes de aprobación.
- **Creación de usuarios:** formulario condicionado según el rol (*jefe* o *captador*).
- **Asignación de equipos:** vinculación de captadores a jefes y equipos.
- **Edición y eliminación:** reasignación de miembros y limpieza de estructuras al borrar un usuario.
- **Roles separados:** la tabla de roles es independiente del perfil, siguiendo buenas prácticas de seguridad.

## Modelo de roles

| Rol | Capacidades |
| --- | --- |
| **Administrador** | Visión global, CRUD completo de tareas, usuarios, equipos y objetivos. |
| **Jefe de equipo** | Captador con objetivos propios y supervisión de los captadores de su equipo. |
| **Captador** | Registro de captaciones, consulta de objetivos personales y tareas asignadas. |

La jerarquía se refleja tanto en la interfaz como en las políticas de acceso del backend.

---

## Seguridad y buenas prácticas

- Row Level Security activado en todas las tablas públicas.
- Funciones de seguridad con `SECURITY DEFINER` para evitar recursiones en políticas.
- Roles almacenados en tabla independiente, nunca en el perfil, para prevenir escaladas de privilegios.
- Edge Functions dedicadas para operaciones privilegiadas como creación de usuarios.

---

## Cómo empezar

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el entorno de desarrollo:
   ```bash
   npm run dev
   ```
4. Abrir `http://localhost:8080`.

## Notas de arquitectura

Este proyecto ha sido diseñado bajo un enfoque de **arquitectura limpia orientada a dominio**. Cada módulo encapsula su propia lógica, los hooks de datos centralizan el acceso al backend y la interfaz se mantiene desacoplada de las decisiones de infraestructura.

## Origen del MVP y puesta en producción

El MVP inicial para validación con cliente fue realizado con Lovable. La puesta en producción se realizó posteriormente sobre dominio propio, con Supabase como backend, base de datos y sistema de autenticación.

---

**Vita. f2f** — *Gestión inteligente para equipos que captan futuro.*
