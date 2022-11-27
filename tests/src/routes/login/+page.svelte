<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

{#if data.isConnected}
  <form method="POST" action="?/logout">
    <button type="submit">Logout</button>
  </form>
{:else}
  <form method="POST" action="?/login">
    <button type="submit">Login</button>
  </form>
{/if}
