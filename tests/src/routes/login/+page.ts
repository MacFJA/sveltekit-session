import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageLoad = ({ data, params, url }) => {
  const session = data?.session;

  return {
    isConnected: session?.isConnected ?? false,
  };
};
