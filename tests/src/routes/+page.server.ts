import type { PageServerLoad } from "./$types";
import { serverLoad } from "../../../src";

export const load: PageServerLoad = async ({ locals }) => {
  return { ...serverLoad({ locals }) };
};
