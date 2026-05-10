import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as {
      adminId: string;
      role: string;
    };

    if (payload.role !== "admin") return null;

    return payload;
  } catch {
    return null;
  }
}