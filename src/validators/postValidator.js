const { z } = require("zod");

const contentSchema = z.array(
  z.object({
    type: z.enum(["paragraph", "link"]),
    content: z.string().min(1),
  })
);

const postSchema = z.object({
  author: z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    avatarUrl: z.string().url(),
  }),
  content: contentSchema.min(1),
  publishedAt: z.string().refine((val) => !isNaN(Date.parse(val))),
});

module.exports = { postSchema };
