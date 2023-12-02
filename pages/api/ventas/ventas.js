import { PrismaClient } from "@prisma/client";

export default async function getVentas(req, res) {
  try {
    const prisma = new PrismaClient();

    const ventas = await prisma.ventas.findMany();
    prisma.$disconnect();
    res.status(200).json(ventas);    
  } catch (error) {
    prisma.$disconnect();
    console.error("Error al obtener las ventas:", error);
    res.status(500).json({ error: "Error al obtener las ventas" });
  }
}
