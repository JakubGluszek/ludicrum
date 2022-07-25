import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter } from "./context";

const eventRouter = createRouter()
  .query("all-events", {
    async resolve({ ctx }) {
      const events = ctx.prisma.event.findMany();

      return events;
    },
  })
  .query("event-details", {
    input: z.object({
      id: z.string().cuid(),
    }),
    async resolve({ ctx, input }) {
      const event = ctx.prisma.event.findFirst({
        where: {
          id: input.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          EventReview: {
            select: {
              id: true,
              body: true,
              rating: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      return event;
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
