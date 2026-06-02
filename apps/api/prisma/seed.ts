import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

async function main(): Promise<void> {
  console.log('Seeding database...');

  // ── Roles ──
  const roles = [
    { name: 'customer', description: 'Cliente regular de la tienda' },
    { name: 'admin', description: 'Administrador del sistema' },
    { name: 'operator', description: 'Operador de pedidos e inventario' },
  ];

  const createdRoles: Record<string, string> = {};
  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
    createdRoles[role.name] = created.id;
  }

  // ── Permisos base ──
  const permissions = [
    { key: 'products:read', description: 'Leer productos del catálogo' },
    { key: 'products:write', description: 'Crear y editar productos' },
    { key: 'orders:read', description: 'Leer pedidos' },
    { key: 'orders:write', description: 'Crear y actualizar pedidos' },
    { key: 'users:read', description: 'Leer usuarios' },
    { key: 'users:write', description: 'Crear y editar usuarios' },
    { key: 'inventory:read', description: 'Consultar inventario' },
    { key: 'inventory:write', description: 'Ajustar inventario' },
    { key: 'payments:read', description: 'Leer pagos' },
    { key: 'payments:write', description: 'Procesar pagos' },
  ];

  const createdPermissions: Record<string, string> = {};
  for (const perm of permissions) {
    const created = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: perm,
    });
    createdPermissions[perm.key] = created.id;
  }

  // ── Asignacion rol ↔ permiso ──
  const rolePermissionMap: Record<string, string[]> = {
    admin: Object.keys(createdPermissions),
    operator: ['products:read', 'orders:read', 'orders:write', 'inventory:read'],
    customer: ['products:read'],
  };

  for (const [roleName, permKeys] of Object.entries(rolePermissionMap)) {
    const roleId = createdRoles[roleName];
    for (const permKey of permKeys) {
      const permissionId = createdPermissions[permKey];
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  // ── Usuario admin ──
  const adminEmail = 'admin@tienda.local';
  const adminPasswordHash = hashPassword('Admin123!');

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: 'Admin', passwordHash: adminPasswordHash },
    create: {
      email: adminEmail,
      name: 'Admin',
      passwordHash: adminPasswordHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: createdRoles.admin } },
    update: {},
    create: { userId: adminUser.id, roleId: createdRoles.admin },
  });

  // ── Categorias demo ──
  const categoriesData = [
    { name: 'Electrónica', slug: 'electronica' },
    { name: 'Ropa y Accesorios', slug: 'ropa-y-accesorios' },
    { name: 'Hogar', slug: 'hogar' },
    { name: 'Deportes', slug: 'deportes' },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
  }

  // ── Productos demo ──
  const productsData = [
    {
      sku: 'AUR-WL-001',
      name: 'Auriculares Inalámbricos Pro',
      description: 'Auriculares Bluetooth con cancelación de ruido activa',
      categorySlug: 'electronica',
      variants: [
        { sku: 'AUR-WL-001-N', price: 79.99, listPrice: 99.99, attributes: { color: 'Negro' } },
        { sku: 'AUR-WL-001-B', price: 79.99, listPrice: 99.99, attributes: { color: 'Blanco' } },
      ],
    },
    {
      sku: 'TEC-KB-001',
      name: 'Teclado Mecánico RGB',
      description: 'Teclado mecánico con switches Cherry MX y retroiluminación RGB',
      categorySlug: 'electronica',
      variants: [
        { sku: 'TEC-KB-001-E', price: 129.99, listPrice: 149.99, attributes: { layout: 'ES' } },
        { sku: 'TEC-KB-001-U', price: 119.99, listPrice: 139.99, attributes: { layout: 'US' } },
      ],
    },
    {
      sku: 'CAM-TS-001',
      name: 'Camiseta Algodón Premium',
      description: 'Camiseta de algodón orgánico, corte regular',
      categorySlug: 'ropa-y-accesorios',
      variants: [
        { sku: 'CAM-TS-001-M', price: 24.99, listPrice: 29.99, attributes: { talla: 'M', color: 'Azul' } },
        { sku: 'CAM-TS-001-L', price: 24.99, listPrice: 29.99, attributes: { talla: 'L', color: 'Azul' } },
        { sku: 'CAM-TS-001-XL', price: 26.99, listPrice: 31.99, attributes: { talla: 'XL', color: 'Azul' } },
      ],
    },
    {
      sku: 'LMP-LD-001',
      name: 'Lámpara LED Inteligente',
      description: 'Lámpara LED con control por app, 16M colores y compatible con Alexa',
      categorySlug: 'hogar',
      variants: [
        { sku: 'LMP-LD-001-A', price: 34.99, listPrice: 44.99, attributes: { potencia: '9W', base: 'E27' } },
      ],
    },
    {
      sku: 'ZAP-RN-001',
      name: 'Zapatillas Running Acolchadas',
      description: 'Zapatillas de running con amortiguación reactiva y suela Vibram',
      categorySlug: 'deportes',
      variants: [
        { sku: 'ZAP-RN-001-42', price: 89.99, listPrice: 109.99, attributes: { talla: '42', color: 'Gris' } },
        { sku: 'ZAP-RN-001-43', price: 89.99, listPrice: 109.99, attributes: { talla: '43', color: 'Gris' } },
        { sku: 'ZAP-RN-001-44', price: 89.99, listPrice: 109.99, attributes: { talla: '44', color: 'Gris' } },
      ],
    },
  ];

  for (const productData of productsData) {
    const existingProduct = await prisma.product.findUnique({ where: { sku: productData.sku } });
    let product;
    if (existingProduct) {
      product = await prisma.product.update({
        where: { sku: productData.sku },
        data: { name: productData.name, description: productData.description },
      });
    } else {
      product = await prisma.product.create({
        data: {
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          categories: {
            create: { categoryId: createdCategories[productData.categorySlug] },
          },
        },
      });
    }

    for (const variantData of productData.variants) {
      const existingVariant = await prisma.productVariant.findUnique({ where: { sku: variantData.sku } });
      if (existingVariant) {
        await prisma.productVariant.update({
          where: { sku: variantData.sku },
          data: {
            price: variantData.price,
            listPrice: variantData.listPrice ?? null,
            attributes: variantData.attributes ?? undefined,
          },
        });
      } else {
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: variantData.sku,
            price: variantData.price,
            listPrice: variantData.listPrice ?? null,
            attributes: variantData.attributes ?? undefined,
          },
        });

        await prisma.inventory.upsert({
          where: { variantId: variant.id },
          update: {},
          create: {
            variantId: variant.id,
            quantity: 100,
            reserved: 0,
            safetyStock: 10,
          },
        });
      }
    }
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
