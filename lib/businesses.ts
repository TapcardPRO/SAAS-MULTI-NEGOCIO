export type Business = {
  slug: string;
  name: string;
  category: string;
  description: string;

  whatsapp: string;
  instagram: string;
  address: string;

  logoText: string;

  // Identidade visual
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;

  // Imagens
  logoUrl: string;
  coverUrl: string;
  gallery: string[];
};

export const businesses: Business[] = [
  {
    slug: "engenheiros-do-corte",
    name: "Engenheiros do Corte",
    category: "Barbearia",

    description:
      "Mais que um corte, uma experiência. Atendimento de qualidade, profissionais especializados e um espaço pensado para você.",

    whatsapp: "(21) 99999-9999",
    instagram: "@engenheirosdocorte",
    address: "Rio de Janeiro - RJ",

    logoText: "EC",

    primaryColor: "#22c55e",
    secondaryColor: "#18181b",
    backgroundColor: "#09090b",
    textColor: "#ffffff",

    logoUrl: "",
    coverUrl: "",
    gallery: [],
  },

  {
    slug: "studio-bella",
    name: "Studio Bella",
    category: "Manicure",

    description:
      "Beleza, cuidado e autoestima em cada detalhe. Atendimento personalizado para unhas impecáveis.",

    whatsapp: "(21) 98888-7777",
    instagram: "@studiobella",
    address: "Rio de Janeiro - RJ",

    logoText: "SB",

    primaryColor: "#ec4899",
    secondaryColor: "#fdf2f8",
    backgroundColor: "#ffffff",
    textColor: "#18181b",

    logoUrl: "",
    coverUrl: "",
    gallery: [],
  },
];

export function getBusinessBySlug(slug: string) {
  return businesses.find((business) => business.slug === slug);
}