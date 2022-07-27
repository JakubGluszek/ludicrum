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
      title: z.string().min(4).max(64),
      description: z.string().min(16).max(512),
      lat: z.string(),
      lng: z.string(),
      date: z.date(),
      dateEnd: z.date(),
      isHost: z.boolean(),
    }),
    async resolve({ ctx, input }) {
      try {
        const event = await ctx.prisma.event.create({
          data: {
            title: input.title,
            description: input.description,
            lat: input.lat,
            lng: input.lng,
            date: input.date,
            dateEnd: input.dateEnd,
            userId: input.isHost ? ctx.session.user.id : null,
          },
        });
        return event;
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can only host 1 event at a time",
        });
      }
    },
  })
  .mutation("update", {
    input: z.object({
      id: z.string().cuid(),
      data: z.object({
        title: z.string().min(4).max(64).optional(),
        description: z.string().min(16).max(512).optional(),
        date: z.date().optional(),
        dateEnd: z.date().optional(),
        lat: z.string().optional(),
        lng: z.string().optional(),
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
  .query("my-event", {
    async resolve({ ctx }) {
      const event = await ctx.prisma.event.findFirst({
        where: {
          userId: ctx.session.user.id,
        },
      });

      return event;
    },
  })
  .mutation("delete", {
    input: z.object({
      id: z.string().cuid(),
    }),
    async resolve({ ctx, input }) {
      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.id,
        },
      });

      if (event) {
        if (event.userId && event.userId !== ctx.session.user.id) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const { id } = await ctx.prisma.event.delete({
          where: {
            id: input.id,
          },
          select: {
            id: true,
          },
        });

        return { id };
      }

      const { id } = await ctx.prisma.event.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        select: {
          id: true,
        },
      });

      return { id };
    },
  })
  .mutation("generate-review-code", {
    async resolve({ ctx }) {
      const r = (Math.random() + 1).toString(36).substring(7);

      await ctx.prisma.event.update({
        where: {
          userId: ctx.session.user.id,
        },
        data: {
          reviewCode: r,
        },
      });

      return { code: r };
    },
  });

export default eventRouter;
