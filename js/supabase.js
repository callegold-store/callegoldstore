
/**
 * Conexión de Callegold con Supabase
 */

(() => {
  const SUPABASE_URL = "https://xwczqbocbsythaegyonh.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_RPwSuH7ia7ctxVK4I8meFw_3qDlaw2P";

  if (!window.supabase) {
    console.error("No se ha cargado la librería de Supabase.");
    return;
  }

  window.callegoldDB = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  console.log("Callegold conectado con Supabase.");
})();
