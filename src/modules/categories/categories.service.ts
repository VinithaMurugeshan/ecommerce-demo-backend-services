import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const categoriesService = {
  async list() {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
  },

  async getBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: { children: true },
    });
    if (!category) throw ApiError.notFound("Category not found");
    return category;
  },

  async create(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    parentId?: string;
  }) {
    return prisma.category.create({
      data: { ...data, slug: slugify(data.name) },
    });
  },

  async update(
    id: string,
    data: { name?: string; description?: string; imageUrl?: string; parentId?: string }
  ) {
    const payload: Record<string, unknown> = { ...data };
    if (data.name) payload.slug = slugify(data.name);
    return prisma.category.update({ where: { id }, data: payload });
  },

  async remove(id: string) {
    await prisma.category.delete({ where: { id } });
    return { message: "Category deleted" };
  },
};
