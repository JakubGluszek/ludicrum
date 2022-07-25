// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";
import eventRouter from "./event";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("events.", eventRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
