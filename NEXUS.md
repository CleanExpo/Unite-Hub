# Duncan Perkins Nexus — Ecosystem Link

**This project is part of the Duncan Perkins Nexus.**

## What is the Nexus?

Duncanperkins.com is the central hub connecting property, finance, legal, and construction services. This repository (Unite-Hub) is the CRM and client portal for the entire ecosystem.

## Full Ecosystem Map

See the central Nexus documentation in the ITR-Button repository:

**https://github.com/CleanExpo/ITR-Button/blob/main/docs/NEXUS.md**

## How This Project Fits

Unite-Hub is the **CRM / client portal** of the Nexus. It contains:
- Client management and intake
- Gmail integration and evidence capture
- Linear issue tracking
- Vercel deployment management

## Hub-and-Spoke Diagram

```
                    ┌─────────────────┐
                    │   ITR-Button    │
                    │  (tax entry)    │
                    └────────┬────────┘
                             │
    ┌──────────────┐    ┌────┴────┐    ┌──────────────┐
    │ Home Loan    │◄───┤ Duncan  ├───►│  Lawyers     │
    │ Essentials   │    │perkins. │    │              │
    └──────────────┘    │  com    │    └──────────────┘
                        │  (Nexus)│
    ┌──────────────┐    │  HUB    │    ┌──────────────┐
    │    Banks     │◄───┤         ├───►│  Financial   │
    │              │    └────┬────┘    │  Planners    │
    └──────────────┘         │         └──────────────┘
                             │
                    ┌────────┴────────┐
                    │ Architects /    │
                    │ Builders /      │
                    │ Developers      │
                    └─────────────────┘
```

## Related Repositories

| Repository | Role in Nexus |
|------------|---------------|
| [ITR-Button](https://github.com/CleanExpo/ITR-Button) | Tax return entry point + NOAH referral router |
| [DIY-Home-Loan](https://github.com/CleanExpo/DIY-Home-Loan) | Home loan journey |
| [brain-1](https://github.com/CleanExpo/brain-1) | Strategic memory and commercial terms |
| [Pi-Dev-Ops](https://github.com/CleanExpo/Pi-Dev-Ops) | Discovery orchestration |
| [Unite-Hub](https://github.com/CleanExpo/Unite-Hub) | CRM / client portal (this repo) |
| [Unite-Group](https://github.com/CleanExpo/Unite-Group) | Synthex Authority Hub |

---

*Last updated: 2026-05-31*
*Source: Duncan's hand-drawn Nexus diagram*
