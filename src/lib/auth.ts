import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { User, Role } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "ludoearn_super_secret_jwt_key_2026_9482751928";
const COOKIE_NAME = "ludoearn_token";

export interface TokenPayload {
  userId: string;
  role: Role;
  phone: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const u = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!u || u.isBanned) return null;

  return {
    id: u.id,
    phone: u.phone,
    passwordHash: u.passwordHash,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role as Role,
    mainBalance: Number(u.mainBalance),
    winBalance: Number(u.winBalance),
    referCode: u.referCode,
    referredBy: u.referredBy ?? null,
    avatar: u.avatar ?? null,
    isBanned: u.isBanned,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function sanitizeUser(user: User) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
