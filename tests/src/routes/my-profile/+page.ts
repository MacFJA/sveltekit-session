import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageLoad = ({ data, params, url }) => {
  const session = data?.session;

  if (!session.isConnected) {
    throw error(403);
  }

  return {
    session,
  };
};
