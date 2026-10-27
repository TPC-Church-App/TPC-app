# TPC Church App — API Contract

**Version:** 1.0
**Last Updated:** 10-27-2026
**Backend:** Supabase Edge Functions / PostgreSQL

## 1. Overview
This document defines the API endpoints for the TPC Church App. The frontend (React Native) will use these endpoints to interact with the backend. 

**Base URL (Local):** `http://localhost:54321/functions/v1`
**Base URL (Production):** `https://<your-project-ref>.supabase.co/functions/v1`
**Authentication:** All endpoints (except webhooks) require a Bearer token in the header: `Authorization: Bearer <supabase_access_token>`

---

## 2. Standard Response Format

**Success Response (200 OK):**
```json
{
  "data": { ... },
  "error": null
}