# Phase 96: Unified Frontend Console (UFC)

## Overview

The Unified Frontend Console (UFC) creates one seamless UI combining all engine dashboards into a single enterprise console with pluggable modules and role-based visibility.

## Architecture

### Console Structure

```
/console
├── /overview          - Global dashboard
├── /maos             - MAOS orchestrator
├── /asrs             - Safety & risk
├── /mcse             - Cognitive supervisor
├── /upewe            - Predictions & warnings
├── /aire             - Incident response
├── /sorie            - Strategic objectives
├── /egcbi            - Governance & compliance
├── /grh              - Regulatory harmonisation
├── /raaoe            - Region operations
├── /gslpie           - SLA & performance
├── /aglbase          - Load balancing & scaling
├── /tcpqel           - Plans & quotas
└── /ucscel           - Contract enforcement
```

### Module Components

Each engine module includes:
- Dashboard overview
- Dataset explorer
- Signals view
- Configuration panel
- Action controls

### Role-Based Visibility

- **Admin**: Full access to all modules
- **Operator**: Monitoring and limited actions
- **Viewer**: Read-only dashboards
- **Auditor**: Compliance and audit logs only

## Features

- Global navigation sidebar
- Multi-tenant switching
- Real-time signal streams
- Region maps with live status
- Runbook execution interface
- Strategy visualization
- Cross-engine correlation views

## Integration

All 14 engines integrated:
MAOS, ASRS, MCSE, UPEWE, AIRE, SORIE, EGCBI, GRH-RAPE, RAAOE, GSLPIE, AGLBASE, TCPQEL, UCSCEL
