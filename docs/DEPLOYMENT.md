# TPC Church App — Deployment Documentation

## Backend (Supabase)
1. **Install Supabase CLI:** `npm install -g supabase`
2. **Link Project:** `supabase link --project-ref <your-project-ref>`
3. **Push Migrations:** `supabase db push`
4. **Set Secrets:**
   ```bash
   supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxx
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJxxx
   supabase secrets set APP_URL=https://admin.tpc-church.app