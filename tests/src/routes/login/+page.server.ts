import type { Actions, PageServerLoad } from "./$types";
import type { SessionLocals } from "../../../../src";
import { serverLoad } from "../../../../src";

export const load: PageServerLoad = serverLoad;

export const actions: Actions = {
  login: (event) => {
    (event.locals as SessionLocals).session.isConnected = true;
    (event.locals as SessionLocals).session.name = "John";
  },
  logout: (event) => {
    (event.locals as SessionLocals).session.isConnected = false;
    delete (event.locals as SessionLocals).session.name;
  },
};
