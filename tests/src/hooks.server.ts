import type { Handle } from "@sveltejs/kit";
import { serverHook } from "../../src";

export const handle: Handle = serverHook;
