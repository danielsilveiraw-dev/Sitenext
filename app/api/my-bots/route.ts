import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);



    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    await prisma.user.upsert({
      where: {
        id: session.user.id,
      },
      update: {
        name: session.user.name || "Usuário",
        avatar: session.user.image || null,
      },
      create: {
        id: session.user.id,
        name: session.user.name || "Usuário",
        avatar: session.user.image || null,
      },
    });

    const bots = await prisma.bot.findMany({
      where: {
        accesses: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        accesses: {
          where: {
            userId: session.user.id,
          },
          select: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bots);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}