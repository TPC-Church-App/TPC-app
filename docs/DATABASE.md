# TPC Church App — Database Documentation

## Overview
The backend is built on **Supabase (PostgreSQL)**. It uses Row Level Security (RLS) to enforce strict data access rules at the database level.

## Tables

| Table | Purpose | Key Relationships |
|---|---|---|
| `profiles` | App users (members, ushers, finance, pastors, admins) | Links to `auth.users` |
| `members` | Church-specific details for members | 1:1 with `profiles` |
| `services` | Church services for attendance | Has many `attendance` |
| `attendance` | Check-in records | Belongs to `profiles` and `services` |
| `funds` | Giving categories (Tithe, Offering, Building, Missions) | Has many `offerings` |
| `offerings` | Every gift given | Belongs to `profiles` and `funds` |
| `payments` | Paystack transaction records | 1:1 with `offerings` |
| `notifications` | Push notifications sent to users | Belongs to `profiles` |
| `audit_logs` | Append-only log of sensitive actions | Belongs to `profiles` |
| `webhook_events` | Idempotency record for Paystack webhooks | — |

## Row Level Security (RLS)
RLS is enabled on all tables. Access is controlled by the `role` column in the `profiles` table.

| Role | Access |
|---|---|
| **Member** | Own profile, own attendance, own offerings, own notifications |
| **Usher** | View all attendance, insert attendance, view live attendance |
| **Finance** | View all offerings and payments, export reports |
| **Pastor** | View all reports, manage services and members |
| **Super Admin** | Full access, manage roles and settings |

## Webhook Security
Paystack webhooks are verified using HMAC SHA512 signature checks in the `paystack-webhook` Edge Function. Duplicate events are ignored via the `webhook_events` table.   