import { PrismaClient } from "@prisma/client";

export default async function getUsuarios(req, res) {
  try {
    const prisma = new PrismaClient();

    const usuarios = await prisma.Usuarios.findMany({
      include: {
        rol: {
          select: {
            rol: true,
          },
        },
      },
    });

    
    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al obtener roles:", error);
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
}
