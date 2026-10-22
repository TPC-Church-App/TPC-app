// ===============================================================
// _shared/cors.ts
// Shares browser response headers for authenticated payment routes.
// ===============================================================

// ===============================================================
// BROWSER REQUEST HEADERS
// Keep the existing origin policy; authentication still runs on
// every payment request. Declare the methods used by these routes.
// ===============================================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
