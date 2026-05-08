import { prisma } from "@/lib/prisma"
import { BotRole } from "@prisma/client"

const rolePower: Record<BotRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
}

export async function getBotAccess(userId: string, botId: string) {
  return prisma.botAccess.findUnique({
    where: {
      botId_userId: {
        botId,
        userId,
      },
    },
  })
}

export async function hasBotRole(
  userId: string,
  botId: string,
  requiredRole: BotRole
) {
  const access = await getBotAccess(userId, botId)

  if (!access) return false

  return rolePower[access.role] >= rolePower[requiredRole]
}

export async function requireBotRole(
  userId: string,
  botId: string,
  requiredRole: BotRole
) {
  const access = await getBotAccess(userId, botId)

  if (!access) {
    throw new Error("Você não tem acesso a este bot.")
  }

  if (rolePower[access.role] < rolePower[requiredRole]) {
    throw new Error("Você não tem permissão para executar esta ação.")
  }

  return access
}