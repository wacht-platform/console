import { lazy, ComponentType, LazyExoticComponent } from "react";

/**
 * A wrapper around React.lazy that handles chunk loading errors by reloading the page.
 * This commonly happens when a new deployment occurs and the old chunks are no longer available.
 */
export function lazyImport<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error: any) {
      // Check for common chunk loading errors
      const isChunkLoadError =
        error.name === "TypeError" &&
        (error.message.includes("dynamically imported module") ||
          error.message.includes("Loading chunk") ||
          error.message.includes("Importing a module script failed"));

      if (isChunkLoadError) {
        // If we haven't already reloaded (to prevent infinite loops), reload the page
        const storageKey = "wacht_chunk_load_error_reload";
        const lastReload = sessionStorage.getItem(storageKey);
        const now = Date.now();

        // Only reload if we haven't done so in the last 10 seconds
        if (!lastReload || now - parseInt(lastReload) > 10000) {
          sessionStorage.setItem(storageKey, now.toString());
          window.location.reload();
          // Return a never-resolving promise to stall React rendering until reload happens
          return new Promise(() => {});
        }
      }

      // If it's not a chunk error or we just reloaded, re-throw
      throw error;
    }
  });
}
