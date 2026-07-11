import { DataSource, Repository } from 'typeorm';
import { CategoryOrmEntity } from '@/modules/categories/infrastructure/persistence/category.orm-entity';

interface CategoryDef {
  name: string;
  slug: string;
  children?: { name: string; slug: string }[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    name: 'Ropa',
    slug: 'ropa',
    children: [
      { name: 'Ropa de Hombre', slug: 'ropa-hombre' },
      { name: 'Ropa de Mujer', slug: 'ropa-mujer' },
      { name: 'Ropa de Niños', slug: 'ropa-ninos' },
    ],
  },
  {
    name: 'Calzado',
    slug: 'calzado',
    children: [
      { name: 'Zapatillas', slug: 'zapatillas' },
      { name: 'Zapatos Formales', slug: 'zapatos-formales' },
      { name: 'Sandalias', slug: 'sandalias' },
    ],
  },
  {
    name: 'Electrónica',
    slug: 'electronica',
    children: [
      { name: 'Celulares', slug: 'celulares' },
      { name: 'Computadoras', slug: 'computadoras' },
      { name: 'Audio', slug: 'audio' },
    ],
  },
  {
    name: 'Hogar',
    slug: 'hogar',
    children: [
      { name: 'Muebles', slug: 'muebles' },
      { name: 'Decoración', slug: 'decoracion' },
      { name: 'Cocina', slug: 'cocina' },
    ],
  },
  {
    name: 'Deportes',
    slug: 'deportes',
    children: [
      { name: 'Fitness', slug: 'fitness' },
      { name: 'Outdoor', slug: 'outdoor' },
    ],
  },
  { name: 'Belleza y Cuidado Personal', slug: 'belleza-cuidado-personal' },
  { name: 'Accesorios', slug: 'accesorios' },
  { name: 'Juguetería', slug: 'jugueteria' },
];

export async function seedCategories(ds: DataSource, companyId: string): Promise<void> {
  const repo = ds.getRepository(CategoryOrmEntity);
  let created = 0;

  for (const [index, def] of CATEGORIES.entries()) {
    const parentId = await upsertCategory(repo, companyId, def.name, def.slug, null, index);
    if (parentId.created) created += 1;

    for (const [childIndex, child] of (def.children ?? []).entries()) {
      const result = await upsertCategory(repo, companyId, child.name, child.slug, parentId.id, childIndex);
      if (result.created) created += 1;
    }
  }

  console.log(`[seed] ${created} categor${created === 1 ? 'ía' : 'ías'} creada(s)`);
}

async function upsertCategory(
  repo: Repository<CategoryOrmEntity>,
  companyId: string,
  name: string,
  slug: string,
  parentId: string | null,
  sortOrder: number,
): Promise<{ id: string; created: boolean }> {
  const existing = await repo.findOne({ where: { companyId, slug } });
  if (existing) return { id: existing.id, created: false };

  const saved = await repo.save(
    repo.create({ companyId, parentId, name, slug, sortOrder, imageUrl: null, isActive: true }),
  );
  return { id: saved.id, created: true };
}
