import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter } from "./context";

const eventRouter = createRouter()
  .query("all-events", {
    async resolve({ ctx }) {
      const events = await ctx.prisma.event.findMany();

      return events;
    },
  })
  .query("event-details", {
    input: z.object({
      id: z.string().cuid(),
    }),
    async resolve({ ctx, input }) {
      const event = await ctx.prisma.event.findFirst({
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
          reviews: {
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
  })
  .mutation("create", {
    input: z.object({
      name: z.string().min(6).max(64),
      description: z.string().min(0).max(512),
      lat: z.string(),
      lng: z.string(),
      date: z.date(),
    }),
    async resolve({ ctx, input }) {
      const event = await ctx.prisma.event.create({
        data: {
          ...input,
          userId: ctx.session.user.id!,
        },
      });

      return event;
    },
  })
  .mutation("update", {
    input: z.object({
      id: z.string().cuid(),
      data: z.object({
        name: z.string().min(6).max(64).optional(),
        description: z.string().min(0).max(512).optional(),
        lat: z.string().optional(),
        lng: z.string().optional(),
        date: z.date().optional(),
      }),
    }),
    async resolve({ ctx, input }) {
      const event = await ctx.prisma.event.update({
        where: {
          userId: ctx.session.user.id,
          id: input.id,
        },
        data: input.data,
      });

      return event;
    },
  })
  .mutation("generate-review-code", {
    input: z.object({
      id: z.string().cuid(),
    }),
    async resolve({ ctx, input }) {
      let r = (Math.random() + 1).toString(36).substring(7);

      await ctx.prisma.event.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id!,
        },
        data: {
          reviewCode: r,
        },
      });

      return r;
    },
  })
  .mutation("create-review", {
    input: z.object({
      eventId: z.string().cuid(),
      body: z.string().max(256).optional(),
      rating: z.number(),
    }),
    async resolve({ ctx, input }) {
      return;
    },
  });

export default eventRouter;
