(function () {
  const SUPABASE_URL = 'https://fhnadcylliknswpqnjfn.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobmFkY3lsbGlrbnN3cHFuamZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDczNzcsImV4cCI6MjA5MjYyMzM3N30.pCpOHKphn2UfSeAeX1lnkLmEo2zbN0yQy3IjntCCpW0';

  window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  // Returns the base URL of the app (works for both http:// and file://)
  window.getBaseUrl = function () {
    return window.location.href.replace(/[^/]*(\?.*)?$/, '');
  };

  // Redirect to login if not authenticated; returns session or null
  window.requireAuth = async function () {
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }
    return session;
  };
})();
