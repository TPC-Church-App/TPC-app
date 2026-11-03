# TPC Church App - API Contract

**Revision:** 2.0 (03 November 2026)
**Status:** Integrated & Verified. All 5 phases of the PR review are complete.

## Boundaries & Environment

The mobile app is fully connected to the live Supabase Cloud database and Auth. It uses Edge Functions for secure payment initialization, verification, and attendance check-in. 

**Hosted Function Base URL:** `https://eqkicyqqwwrjpikcsbas.supabase.co/functions/v1`
**Authentication:** All member endpoints require `Authorization: Bearer <access-token>` and validate the caller via Supabase Auth. Service-role keys are never used on the client side.

## Phase 1 & 2: Identity and Access

- **Profile Provisioning:** A PostgreSQL trigger (`on_auth_user_created`) automatically creates a row in the `profiles` table for every new user. The `phone` column is now optional in the DB to prevent signups from failing.
- **Access Control:** The legacy `is_verified` barrier has been removed from both the database triggers and the Edge Functions. All authenticated members are granted immediate access to giving and attendance features without admin/usher approval.

## POST /offerings-initialize

Prepares a pending offering and returns a Paystack checkout URL.

**Request Body:**
```json
{
  "amount": 500,
  "fund_id": "11111111-1111-4111-8111-111111111111"
}