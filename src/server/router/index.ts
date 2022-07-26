// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";
import eventRouter from "./event";
import reviewRouter from "./review";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("events.", eventRouter)
  .merge("reviews.", reviewRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
