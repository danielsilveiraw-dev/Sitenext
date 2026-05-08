import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";

import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest
) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Não autorizado",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const bot = await prisma.bot.upsert({
      where: {
        id: body.id,
      },

      update: {
        name: body.name,
        avatar: body.avatar,
      },

      create: {
        id: body.id,
        name: body.name,
        avatar: body.avatar,

        userId: session.user.id,
      },
    });

    return NextResponse.json(bot);

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Erro interno",
      },
      {
        status: 500,
      }
    );
  }
}