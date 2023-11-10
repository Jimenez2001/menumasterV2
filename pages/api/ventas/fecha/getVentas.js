import { PrismaClient } from "@prisma/client";

export default async function getVentas(req, res) {
  try {
    const prisma = new PrismaClient();

    const { fechaInicio, fechaFin } = req.body;

    /* console.log(fechaInicio);
    
    console.log(fechaFin); */


    const ventas = await prisma.ventas.findMany({
      where: {
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      },
    });

    res.status(200).json(ventas);
  } catch (error) {
    console.error("Error al obtener las ventas:", error);
    res.status(500).json({ error: "Error al obtener las ventas" });
  }
}
s