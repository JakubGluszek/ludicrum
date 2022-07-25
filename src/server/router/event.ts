import { TRPCError } from "@trpc/server";
import { createRouter } from "./context";

const eventRouter = createRouter()
  .query("all-events", {
    async resolve({ ctx }) {
      const events = ctx.prisma.event.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return events;
    },
  })
  .middleware(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        ...ctx,
        // infers that `session` is non-nullable to downstream resolvers
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

export default eventRouter;
