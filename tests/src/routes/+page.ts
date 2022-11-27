import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageLoad = ({ data, params, url }) => {
  const session = data?.session;

  if (!session.isConnected) {
    throw error(403, "Must be logged in to view this page");
  }

  return {
    session,
  };
};
