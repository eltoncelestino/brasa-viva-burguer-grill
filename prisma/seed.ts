import {
  PrismaClient,
  UserRole,
  OrderType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed completo do Brasa Viva Burger & Grill (Fortaleza - CE)...");

  // Limpeza em ordem segura de dependências
  await prisma.orderItemAddon.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.addonOption.deleteMany();
  await prisma.addonGroup.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();

  // 1. Restaurante (Contexto Fortaleza - CE)
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Brasa Viva Burger & Grill",
      slug: "brasa-viva",
      description:
        "Hamburgueria artesanal fundada em 2019 em Fortaleza. Blends de carne bovina moídos na casa, pães de fermentação natural e molhos autorais na Aldeota.",
      phone: "(85) 99999-0101",
      address: "Av. Desembargador Moreira, 1300 - Aldeota, Fortaleza - CE",
      city: "Fortaleza",
      state: "CE",
      logoUrl:
        "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=300&q=80",
      bannerUrl:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80",
      isOpen: true,
      openingInfo: "Terça a Domingo • 18h às 23h30 (Sábados a partir das 12h)",
    },
  });

  // 2. Usuários Administrativos
  const ownerPasswordHash = await bcrypt.hash("BrasaViva@2026", 10);
  const demoPasswordHash = await bcrypt.hash("demo1234", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Marcos Teixeira (Proprietário)",
        email: "admin@brasaviva.com.br",
        passwordHash: ownerPasswordHash,
        role: UserRole.OWNER,
        restaurantId: restaurant.id,
      },
      {
        name: "Marcos Teixeira (Demo)",
        email: "admin@brasaviva.example.com",
        passwordHash: demoPasswordHash,
        role: UserRole.OWNER,
        restaurantId: restaurant.id,
      },
      {
        name: "Fernanda Lopes (Gerente)",
        email: "gerente@brasaviva.example.com",
        passwordHash: demoPasswordHash,
        role: UserRole.MANAGER,
        restaurantId: restaurant.id,
      },
      {
        name: "Diego Santana (Cozinha)",
        email: "cozinha@brasaviva.com.br",
        passwordHash: demoPasswordHash,
        role: UserRole.KITCHEN,
        restaurantId: restaurant.id,
      },
    ],
  });

  // 3. Zonas de Entrega (Fortaleza - CE)
  const zones = await Promise.all([
    prisma.deliveryZone.create({
      data: {
        neighborhood: "Aldeota",
        feeCents: 600,
        estimatedMinutes: 25,
        restaurantId: restaurant.id,
      },
    }),
    prisma.deliveryZone.create({
      data: {
        neighborhood: "Dionísio Torres",
        feeCents: 700,
        estimatedMinutes: 30,
        restaurantId: restaurant.id,
      },
    }),
    prisma.deliveryZone.create({
      data: {
        neighborhood: "Meireles",
        feeCents: 800,
        estimatedMinutes: 30,
        restaurantId: restaurant.id,
      },
    }),
    prisma.deliveryZone.create({
      data: {
        neighborhood: "Cocó",
        feeCents: 900,
        estimatedMinutes: 35,
        restaurantId: restaurant.id,
      },
    }),
    prisma.deliveryZone.create({
      data: {
        neighborhood: "Beira-Mar",
        feeCents: 1000,
        estimatedMinutes: 35,
        restaurantId: restaurant.id,
      },
    }),
  ]);

  // 4. Mesas (1 a 12 conforme dados demo)
  const tableSpecs = [
    { number: 1, seats: 2, label: "Salão" },
    { number: 2, seats: 2, label: "Salão" },
    { number: 3, seats: 4, label: "Salão" },
    { number: 4, seats: 4, label: "Salão" },
    { number: 5, seats: 4, label: "Salão" },
    { number: 6, seats: 6, label: "Salão" },
    { number: 7, seats: 4, label: "Varanda" },
    { number: 8, seats: 4, label: "Varanda" },
    { number: 9, seats: 2, label: "Varanda" },
    { number: 10, seats: 8, label: "Área externa" },
    { number: 11, seats: 2, label: "Balcão" },
    { number: 12, seats: 2, label: "Balcão" },
  ];

  const tables = await Promise.all(
    tableSpecs.map((t) =>
      prisma.table.create({
        data: {
          number: t.number,
          seats: t.seats,
          label: `${t.label} - Mesa ${t.number}`,
          restaurantId: restaurant.id,
        },
      })
    )
  );

  // 5. Grupos de Adicionais (baseados em brasa-viva-dados-demo.json)
  const grpPontoCarne = await prisma.addonGroup.create({
    data: {
      name: "Ponto da carne",
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 1,
      restaurantId: restaurant.id,
      options: {
        create: [
          { name: "Mal passado", priceCents: 0, sortOrder: 1 },
          { name: "Ao ponto", priceCents: 0, sortOrder: 2 },
          { name: "Bem passado", priceCents: 0, sortOrder: 3 },
        ],
      },
    },
    include: { options: true },
  });

  const grpAdicionaisBurger = await prisma.addonGroup.create({
    data: {
      name: "Adicionais",
      isRequired: false,
      minSelect: 0,
      maxSelect: 5,
      sortOrder: 2,
      restaurantId: restaurant.id,
      options: {
        create: [
          { name: "Bacon crocante", priceCents: 600, sortOrder: 1 },
          { name: "Queijo cheddar extra", priceCents: 500, sortOrder: 2 },
          { name: "Ovo", priceCents: 300, sortOrder: 3 },
          { name: "Cebola caramelizada", priceCents: 400, sortOrder: 4 },
          { name: "Cogumelos salteados", priceCents: 600, sortOrder: 5 },
          { name: "Hambúrguer extra (160 g)", priceCents: 1200, sortOrder: 6 },
          { name: "Molho da casa extra", priceCents: 250, sortOrder: 7 },
        ],
      },
    },
    include: { options: true },
  });

  const grpRemover = await prisma.addonGroup.create({
    data: {
      name: "Remover ingredientes",
      isRequired: false,
      minSelect: 0,
      maxSelect: 4,
      sortOrder: 3,
      restaurantId: restaurant.id,
      options: {
        create: [
          { name: "Sem cebola", priceCents: 0, sortOrder: 1 },
          { name: "Sem tomate", priceCents: 0, sortOrder: 2 },
          { name: "Sem picles", priceCents: 0, sortOrder: 3 },
          { name: "Sem molho", priceCents: 0, sortOrder: 4 },
        ],
      },
    },
    include: { options: true },
  });

  const grpMolhosPorcao = await prisma.addonGroup.create({
    data: {
      name: "Molhos para acompanhar",
      isRequired: false,
      minSelect: 0,
      maxSelect: 3,
      sortOrder: 4,
      restaurantId: restaurant.id,
      options: {
        create: [
          { name: "Maionese defumada", priceCents: 300, sortOrder: 1 },
          { name: "Barbecue", priceCents: 300, sortOrder: 2 },
          { name: "Cheddar cremoso", priceCents: 500, sortOrder: 3 },
          { name: "Geleia de pimenta", priceCents: 400, sortOrder: 4 },
        ],
      },
    },
    include: { options: true },
  });

  const grpSaborRefri = await prisma.addonGroup.create({
    data: {
      name: "Sabor",
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 5,
      restaurantId: restaurant.id,
      options: {
        create: [
          { name: "Cola", priceCents: 0, sortOrder: 1 },
          { name: "Cola zero", priceCents: 0, sortOrder: 2 },
          { name: "Guaraná", priceCents: 0, sortOrder: 3 },
          { name: "Laranja", priceCents: 0, sortOrder: 4 },
        ],
      },
    },
    include: { options: true },
  });

  // 6. Categorias
  const catPromocoes = await prisma.category.create({
    data: {
      name: "Combos e Promoções",
      description: "Combos completos para matar a fome com economia",
      sortOrder: 1,
      restaurantId: restaurant.id,
    },
  });

  const catBurgers = await prisma.category.create({
    data: {
      name: "Hambúrgueres",
      description: "Blends 180g moídos na casa e assados na brasa",
      sortOrder: 2,
      restaurantId: restaurant.id,
    },
  });

  const catPorcoes = await prisma.category.create({
    data: {
      name: "Porções",
      description: "Acompanhamentos crocantes para compartilhar",
      sortOrder: 3,
      restaurantId: restaurant.id,
    },
  });

  const catBebidas = await prisma.category.create({
    data: {
      name: "Bebidas",
      description: "Refrescantes para o clima de Fortaleza",
      sortOrder: 4,
      restaurantId: restaurant.id,
    },
  });

  const catSobremesas = await prisma.category.create({
    data: {
      name: "Sobremesas",
      description: "Para fechar a experiência com chave de ouro",
      sortOrder: 5,
      restaurantId: restaurant.id,
    },
  });

  // 7. Produtos
  // Combos e Promoções
  const comboBrasa = await prisma.product.create({
    data: {
      name: "Combo Brasa Clássico",
      description:
        "Brasa Clássico (180 g) + batata rústica individual + refrigerante lata 350 ml.",
      priceCents: 5290,
      imageUrl:
        "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
      imageQuery: "burger combo fries soda",
      badges: JSON.stringify(["mais-pedido"]),
      sortOrder: 1,
      categoryId: catPromocoes.id,
      restaurantId: restaurant.id,
      addonGroups: {
        connect: [
          { id: grpPontoCarne.id },
          { id: grpAdicionaisBurger.id },
          { id: grpRemover.id },
          { id: grpSaborRefri.id },
        ],
      },
    },
  });

  const comboCasal = await prisma.product.create({
    data: {
      name: "Combo Casal",
      description:
        "2 hambúrgueres à escolha (Clássico ou Cheddar Bacon) + 1 batata rústica grande + 2 refrigerantes lata.",
      priceCents: 9490,
      imageUrl:
        "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=800&q=80",
      imageQuery: "two burgers fries date night",
      badges: JSON.stringify(["novo"]),
      sortOrder: 2,
      categoryId: catPromocoes.id,
      restaurantId: restaurant.id,
      addonGroups: {
        connect: [
          { id: grpPontoCarne.id },
          { id: grpAdicionaisBurger.id },
          { id: grpSaborRefri.id },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Combo Kids",
      description: "Mini burger (90 g), batata frita, suco de caixinha e brinde surpresa.",
      priceCents: 3290,
      imageUrl:
        "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
      imageQuery: "kids meal mini burger fries",
      badges: JSON.stringify([]),
      sortOrder: 3,
      categoryId: catPromocoes.id,
      restaurantId: restaurant.id,
      addonGroups: {
        connect: [{ id: grpRemover.id }],
      },
    },
  });

  // Hambúrgueres
  const brasaClassico = await prisma.product.create({
    data: {
      name: "Brasa Clássico",
      description:
        "Blend bovino 180 g na brasa, queijo prato, alface americana, tomate, picles e molho da casa no pão brioche.",
      priceCents: 3290,
      imageUrl:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      imageQuery: "classic cheeseburger brioche",
      badges: JSON.stringify(["mais-pedido"]),
      sortOrder: 1,
      categoryId: catBurgers.id,
      restaurantId: restaurant.id,
      addonGroups: {
        connect: [
          { id: grpPontoCarne.id },
          { id: grpAdicionaisBurger.id },
          { id: grpRemover.id },
        ],
      },
    },
  });

  const cheddarBacon = await prisma.product.create({
    data: {
      name: "Cheddar Bacon",
      description:
        "Blend 180 g, cheddar inglês derretido, bacon crocante, cebola crispy e maionese defumada.",
      priceCents: 3890,
      imageUrl:
        "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80",
      imageQuery: "bacon cheddar burger",
      badges: JSON.stringify(["mais-pedido"]),
      sortOrder: 2,
      categoryId: catBurgers.id,
      restaurantId: restaurant.id,
      addonGroups: {
        connect: [
          { id: grpPontoCarne.id },
          { id: grpAdicionaisBurger.id },
          { id: grpRemover.id },
        ],
      },
    },
  });

  const fogoParquinho = await prisma.product.create({
    data: {
      name: "Fogo no Parquinho",
      description:
        "Blend 180 g, queijo pepper jack, jalapeño em conserva, geleia de pimenta e cebola roxa.",
      priceCents: 3990,
      imageUrl:
        "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80",
      imageQuery: "spicy jalapeno burger",
      badges: JSON.stringify(["picante"]),
      sortOrder: 3,
      categoryId: catBurgers.id,
      restaurantId: restaurant.id,
      addonGroups: {
        connect: [
          { id: grpPontoCarne.id },
          { id: grpAdicionaisBurger.id },
          { id: grpRemover.id },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Trufado",
      description:
        "Blend 180 g, queijo gruyère, cogumelos salteados, maionese de trufa e rúcula no pão de fermentação natural.",
      priceCents: 4590,
      imageUrl:
        "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80",
      imageQuery: "truffle mushroom gourmet burger",
      badges: JSON.stringify(["novo"]),
      sortOrder: 4,
      categoryId: catBurgers.id,
      restaurantId: restaurant.id,
      addonGroups: {
        connect: [
          { id: grpPontoCarne.id },
          { id: grpAdicionaisBurger.id },
          { id: grpRemover.id },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Frango Crocante",
      description:
        "Sobrecoxa empanada e frita, coleslaw cremoso, picles de pepino e molho barbecue.",
      priceCents: 3490,
      imageUrl:
        "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
      imageQuery: "crispy chicken burger",
      badges: JSON.stringify([]),
      sortOrder: 5,
      categoryId: catBurgers.id,
      restaurantId: restaurant.id,
      addonGroups: {
        connect: [{ id: grpAdicionaisBurger.id }, { id: grpRemover.id }],
      },
    },
  });

  const verdeVivo = await prisma.product.create({
    data: {
      name: "Verde Vivo",
      description:
        "Hambúrguer de grão-de-bico e beterraba, queijo vegetal, tomate confit, rúcula e maionese de ervas.",
      priceCents: 3690,
      imageUrl:
        "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80",
      imageQuery: "vegan burger chickpea",
      badges: JSON.stringify(["vegano"]),
      sortOrder: 6,
      categoryId: catBurgers.id,
      restaurantId: restaurant.id,
      addonGroups: {
        connect: [{ id: grpAdicionaisBurger.id }, { id: grpRemover.id }],
      },
    },
  });

  // Porções
  await prisma.product.create({
    data: {
      name: "Batata Rústica",
      description:
        "Batatas com casca, fritas na hora e temperadas com alecrim e flor de sal.",
      priceCents: 1690,
      imageUrl:
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
      imageQuery: "rustic potato wedges rosemary",
      badges: JSON.stringify(["vegano"]),
      sortOrder: 1,
      categoryId: catPorcoes.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          { name: "Individual (200 g)", priceCents: 0, isDefault: true, sortOrder: 1 },
          { name: "Grande (400 g)", priceCents: 1200, isDefault: false, sortOrder: 2 },
        ],
      },
      addonGroups: {
        connect: [{ id: grpMolhosPorcao.id }],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Batata com Cheddar e Bacon",
      description: "Batata frita coberta com cheddar cremoso e farofa de bacon.",
      priceCents: 3490,
      imageUrl:
        "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80",
      imageQuery: "loaded fries cheese bacon",
      badges: JSON.stringify(["mais-pedido"]),
      sortOrder: 2,
      categoryId: catPorcoes.id,
      restaurantId: restaurant.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Onion Rings",
      description: "Anéis de cebola empanados, crocantes e servidos com molho barbecue.",
      priceCents: 2490,
      imageUrl:
        "https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=80",
      imageQuery: "onion rings",
      badges: JSON.stringify(["vegano"]),
      sortOrder: 3,
      categoryId: catPorcoes.id,
      restaurantId: restaurant.id,
      addonGroups: {
        connect: [{ id: grpMolhosPorcao.id }],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Nuggets Artesanais (10 un.)",
      description: "Peito de frango empanado em panko, com dois molhos à escolha.",
      priceCents: 2890,
      imageUrl:
        "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
      imageQuery: "homemade chicken nuggets",
      badges: JSON.stringify([]),
      sortOrder: 4,
      categoryId: catPorcoes.id,
      restaurantId: restaurant.id,
      addonGroups: {
        connect: [{ id: grpMolhosPorcao.id }],
      },
    },
  });

  // Bebidas
  const refriLata = await prisma.product.create({
    data: {
      name: "Refrigerante Lata 350 ml",
      description: "Gelado, escolha o sabor.",
      priceCents: 700,
      imageUrl:
        "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
      imageQuery: "soda can ice",
      badges: JSON.stringify([]),
      sortOrder: 1,
      categoryId: catBebidas.id,
      restaurantId: restaurant.id,
      addonGroups: {
        connect: [{ id: grpSaborRefri.id }],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Limonada Suíça",
      description: "Limão taiti batido com leite condensado e gelo.",
      priceCents: 1200,
      imageUrl:
        "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
      imageQuery: "creamy lemonade glass",
      badges: JSON.stringify([]),
      sortOrder: 2,
      categoryId: catBebidas.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          { name: "400 ml", priceCents: 0, isDefault: true, sortOrder: 1 },
          { name: "600 ml", priceCents: 400, isDefault: false, sortOrder: 2 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Suco Natural de Laranja",
      description: "Espremido na hora, sem açúcar.",
      priceCents: 1100,
      imageUrl:
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80",
      imageQuery: "fresh orange juice",
      badges: JSON.stringify(["vegano"]),
      sortOrder: 3,
      categoryId: catBebidas.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          { name: "400 ml", priceCents: 0, isDefault: true, sortOrder: 1 },
          { name: "600 ml", priceCents: 400, isDefault: false, sortOrder: 2 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Cerveja Artesanal IPA 500 ml",
      description:
        "IPA artesanal gelada. Contém álcool; venda proibida para menores de 18 anos.",
      priceCents: 2200,
      imageUrl:
        "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80",
      imageQuery: "craft beer IPA glass",
      badges: JSON.stringify([]),
      sortOrder: 4,
      categoryId: catBebidas.id,
      restaurantId: restaurant.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Água Mineral 500 ml",
      description: "Com ou sem gás.",
      priceCents: 450,
      imageUrl:
        "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=800&q=80",
      imageQuery: "mineral water bottle",
      badges: JSON.stringify([]),
      sortOrder: 5,
      categoryId: catBebidas.id,
      restaurantId: restaurant.id,
    },
  });

  // Sobremesas
  const brownie = await prisma.product.create({
    data: {
      name: "Brownie com Sorvete",
      description:
        "Brownie de chocolate meio amargo morno, sorvete de creme e calda de chocolate.",
      priceCents: 2290,
      imageUrl:
        "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=800&q=80",
      imageQuery: "brownie vanilla ice cream",
      badges: JSON.stringify(["mais-pedido"]),
      sortOrder: 1,
      categoryId: catSobremesas.id,
      restaurantId: restaurant.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Milk-shake",
      description: "Cremoso, batido com sorvete artesanal e finalizado com chantilly.",
      priceCents: 1890,
      imageUrl:
        "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
      imageQuery: "milkshake whipped cream",
      badges: JSON.stringify([]),
      sortOrder: 2,
      categoryId: catSobremesas.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          { name: "Chocolate 400 ml", priceCents: 0, isDefault: true, sortOrder: 1 },
          { name: "Morango 400 ml", priceCents: 0, isDefault: false, sortOrder: 2 },
          { name: "Doce de leite 400 ml", priceCents: 100, isDefault: false, sortOrder: 3 },
        ],
      },
    },
  });

  const churros = await prisma.product.create({
    data: {
      name: "Churros com Doce de Leite (6 un.)",
      description:
        "Churros crocantes passados no açúcar com canela, servidos com doce de leite.",
      priceCents: 1890,
      imageUrl:
        "https://images.unsplash.com/photo-1624371414361-e670edf4898d?auto=format&fit=crop&w=800&q=80",
      imageQuery: "churros dulce de leche",
      badges: JSON.stringify(["novo"]),
      sortOrder: 3,
      categoryId: catSobremesas.id,
      restaurantId: restaurant.id,
    },
  });

  // 8. Pedidos de Exemplo (adaptados para Fortaleza - CE)
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

  // Pedido #1042 - Em preparo (Mesa 5)
  await prisma.order.create({
    data: {
      orderNumber: 1042,
      type: OrderType.DINE_IN,
      status: OrderStatus.PREPARING,
      customerName: "Rafael Moura",
      customerPhone: "(85) 99888-1201",
      subtotalCents: 8180,
      deliveryFeeCents: 0,
      totalCents: 8180,
      restaurantId: restaurant.id,
      tableId: tables[4]!.id,
      createdAt: hoursAgo(0.25),
      items: {
        create: [
          {
            productId: cheddarBacon.id,
            productName: cheddarBacon.name,
            quantity: 1,
            unitPriceCents: 4190,
            totalPriceCents: 4190,
            notes: "Sem cebola crispy",
            addons: {
              create: [
                {
                  addonOptionId: grpPontoCarne.options[1]!.id,
                  addonName: grpPontoCarne.options[1]!.name,
                  priceCents: 0,
                },
                {
                  addonOptionId: grpAdicionaisBurger.options[2]!.id,
                  addonName: grpAdicionaisBurger.options[2]!.name,
                  priceCents: 300,
                },
              ],
            },
          },
          {
            productId: brasaClassico.id,
            productName: brasaClassico.name,
            quantity: 1,
            unitPriceCents: 3290,
            totalPriceCents: 3290,
            addons: {
              create: [
                {
                  addonOptionId: grpPontoCarne.options[2]!.id,
                  addonName: grpPontoCarne.options[2]!.name,
                  priceCents: 0,
                },
              ],
            },
          },
          {
            productId: refriLata.id,
            productName: refriLata.name,
            quantity: 1,
            unitPriceCents: 700,
            totalPriceCents: 700,
            addons: {
              create: [
                {
                  addonOptionId: grpSaborRefri.options[2]!.id,
                  addonName: grpSaborRefri.options[2]!.name,
                  priceCents: 0,
                },
              ],
            },
          },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.PIX,
          status: PaymentStatus.PAID,
          amountCents: 8180,
          provider: "mock",
          paidAt: hoursAgo(0.24),
        },
      },
    },
  });

  // Pedido #1043 - Novo (Delivery Aldeota)
  await prisma.order.create({
    data: {
      orderNumber: 1043,
      type: OrderType.DELIVERY,
      status: OrderStatus.NEW,
      customerName: "Camila Duarte",
      customerPhone: "(85) 99777-4455",
      deliveryAddress: "Av. Santos Dumont, 2230, Apto 84 - Aldeota, Fortaleza - CE",
      notes: "Campainha não funciona, ligar ao chegar",
      subtotalCents: 7580,
      deliveryFeeCents: zones[0]!.feeCents,
      totalCents: 7580 + zones[0]!.feeCents,
      restaurantId: restaurant.id,
      deliveryZoneId: zones[0]!.id,
      createdAt: hoursAgo(0.08),
      items: {
        create: [
          {
            productId: comboBrasa.id,
            productName: comboBrasa.name,
            quantity: 1,
            unitPriceCents: 5290,
            totalPriceCents: 5290,
            addons: {
              create: [
                {
                  addonOptionId: grpPontoCarne.options[1]!.id,
                  addonName: grpPontoCarne.options[1]!.name,
                  priceCents: 0,
                },
                {
                  addonOptionId: grpSaborRefri.options[1]!.id,
                  addonName: grpSaborRefri.options[1]!.name,
                  priceCents: 0,
                },
              ],
            },
          },
          {
            productId: brownie.id,
            productName: brownie.name,
            quantity: 1,
            unitPriceCents: 2290,
            totalPriceCents: 2290,
          },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.PIX,
          status: PaymentStatus.PENDING,
          amountCents: 7580 + zones[0]!.feeCents,
          provider: "mock",
        },
      },
    },
  });

  // Pedido #1044 - Pronto (Retirada)
  await prisma.order.create({
    data: {
      orderNumber: 1044,
      type: OrderType.TAKEOUT,
      status: OrderStatus.READY,
      customerName: "Bruno Azevedo",
      customerPhone: "(85) 99666-9090",
      subtotalCents: 7680,
      deliveryFeeCents: 0,
      totalCents: 7680,
      restaurantId: restaurant.id,
      createdAt: hoursAgo(0.5),
      items: {
        create: [
          {
            productId: verdeVivo.id,
            productName: verdeVivo.name,
            quantity: 1,
            unitPriceCents: 3690,
            totalPriceCents: 3690,
            addons: {
              create: [
                {
                  addonOptionId: grpRemover.options[2]!.id,
                  addonName: grpRemover.options[2]!.name,
                  priceCents: 0,
                },
              ],
            },
          },
          {
            productId: fogoParquinho.id,
            productName: fogoParquinho.name,
            quantity: 1,
            unitPriceCents: 3990,
            totalPriceCents: 3990,
            addons: {
              create: [
                {
                  addonOptionId: grpPontoCarne.options[1]!.id,
                  addonName: grpPontoCarne.options[1]!.name,
                  priceCents: 0,
                },
              ],
            },
          },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.PIX,
          status: PaymentStatus.PAID,
          amountCents: 7680,
          provider: "mock",
          paidAt: hoursAgo(0.49),
        },
      },
    },
  });

  // Pedido #1045 - Finalizado (Mesa 10)
  await prisma.order.create({
    data: {
      orderNumber: 1045,
      type: OrderType.DINE_IN,
      status: OrderStatus.FINISHED,
      customerName: "Juliana Prado",
      customerPhone: "(85) 99555-3322",
      notes: "Mesa de aniversário",
      subtotalCents: 20870,
      deliveryFeeCents: 0,
      totalCents: 20870,
      restaurantId: restaurant.id,
      tableId: tables[9]!.id,
      createdAt: hoursAgo(2),
      items: {
        create: [
          {
            productId: comboCasal.id,
            productName: comboCasal.name,
            quantity: 2,
            unitPriceCents: 9490,
            totalPriceCents: 18980,
          },
          {
            productId: churros.id,
            productName: churros.name,
            quantity: 1,
            unitPriceCents: 1890,
            totalPriceCents: 1890,
            notes: "Com uma velinha, por favor",
          },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.CARD_ON_DELIVERY,
          status: PaymentStatus.PAID,
          amountCents: 20870,
          provider: "offline",
          paidAt: hoursAgo(1.9),
        },
      },
    },
  });

  console.log("Seed concluído com sucesso! Brasa Viva Burger & Grill - Fortaleza/CE.");
}

main()
  .catch((e) => {
    console.error("Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
