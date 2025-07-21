const prisma = require('../config/prismaClient');

/* ------------------------------------------------------------- *
 * Helper – build a Prisma “where” object from query parameters  *
 * ------------------------------------------------------------- */
function buildFilter(params = {}) {
  const where = { approved: true };

  if (params.search) {
    where.OR = [
      { title:   { contains: params.search, } },
      { content: { contains: params.search, } }
    ];
  }

  if (params.category) {
    where.category = { name: params.category };
  }

  if (params.from) {
    where.created_at = {
      ...(where.created_at || {}),
      gte: new Date(params.from)
    };
  }
  if (params.to) {
    where.created_at = {
      ...(where.created_at || {}),
      lte: new Date(params.to)
    };
  }

  where.AND = [
    {
      OR: [
        { scheduled_at: null },
        { scheduled_at: { lte: new Date() } }
      ]
    }
  ];

  return where;
}

module.exports = {
  /* ---- queries ------------------------------------------------ */
  list(params = {}) {
    const {
      sort   = 'created_at',
      order  = 'desc',
      limit  = 20,
      offset = 0
    } = params;

    return prisma.post.findMany({
      where:   buildFilter(params),
      orderBy: { [sort]: order },
      skip:    Number(offset),
      take:    Number(limit),
      include: {
        category:  true,
        createdBy: { select: { id: true, username: true } }
      }
    });
  },

  count: params => prisma.post.count({ where: buildFilter(params) }),

  find: id => prisma.post.findUnique({
    where: { id },
    include: {
      category: true,
      createdBy: { select: { id: true, username: true } }
    }
  }),

  /* ---- mutations --------------------------------------------- */
  create: data   => prisma.post.create({ data }),
  update: (id,d) => prisma.post.update({ where: { id }, data: d }),
  remove: id     => prisma.post.delete({ where: { id } }),

  /* ---- likes -------------------------------------------------- */
  like(userId, postId) {
    return prisma.$transaction([
      prisma.postLike.create({ data: { userId, postId } }),
      prisma.post.update({
        where: { id: postId },
        data : { likes: { increment: 1 } }
      })
    ]);
  },

  /* ---- comment -------------------------------------------------- */
  comment(userId, postId) {
    return prisma.$transaction([
      prisma.commentsPost.create({ data: { userId, postId, comment } }),
      prisma.post.update({
        where: { id: postId },
        comment: { data }
      })
    ]);
  },

  /* ---- moderation -------------------------------------------- */
  pending : () => prisma.post.findMany({ where: { approved: false }, include: { category: true, createdBy: true } }),
  approve : id => prisma.post.update({ where: { id }, data: { approved: true  } }),
  reject  : id => prisma.post.delete({ where: { id } })
};
