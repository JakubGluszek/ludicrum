import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter } from "./context";

const reviewRouter = createRouter()
  .query("event-reviews", {
    input: z.object({
      eventId: z.string().cuid(),
    }),
    async resolve({ ctx, input }) {
      const reviews = await ctx.prisma.eventReview.findMany({
        where: {
          eventId: input.eventId,
        },
      });

      return reviews;
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
  })
  .mutation("create", {
    input: z.object({
      eventId: z.string().cuid(),
      rating: z.number().min(0).max(10),
      body: z.string().min(1).max(256).optional(),
      code: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      const event = await ctx.prisma.event.findFirst({
        where: { id: input.eventId },
      });

      if (!event) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      } else if (event.userId) {
        if (input.code !== event.reviewCode) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await ctx.prisma.event.update({
          where: { id: input.eventId },
          data: {
            reviewCode: null,
          },
        });
      }

      const review = await ctx.prisma.eventReview.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });

      return review;
    },
  })
  .mutation("delete", {
    input: z.object({ id: z.string().cuid(), eventId: z.string().cuid() }),
    async resolve({ ctx, input }) {
      const { id } = await ctx.prisma.eventReview.delete({
        where: {
          id: input.id,
          reviewIdentifier: {
            userId: ctx.session.user.id,
            eventId: input.eventId,
          },
        },
        select: {
          id: true,
        },
      });

      return { id };
    },
  });

export default reviewRouter;
