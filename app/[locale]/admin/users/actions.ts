"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { db, schema } from "@/lib/db";
import type { AppRole } from "@/lib/db/schema";

const ROLES: AppRole[] = ["admin", "editor", "viewer"];

function normalizeEmail(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  // Loose RFC-5322-ish check. Intentionally permissive so plus-addressing
  // and corporate subdomains pass.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

function parseRole(raw: FormDataEntryValue | null): AppRole | null {
  if (typeof raw !== "string") return null;
  return ROLES.includes(raw as AppRole) ? (raw as AppRole) : null;
}

function parseNote(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed.slice(0, 200);
}

async function lastAdminCheck(excludeEmail: string): Promise<boolean> {
  const others = await db
    .select({ email: schema.allowedUsers.email })
    .from(schema.allowedUsers)
    .where(
      and(
        eq(schema.allowedUsers.role, "admin"),
        ne(schema.allowedUsers.email, excludeEmail),
      ),
    )
    .limit(1);
  return others.length === 0;
}

export async function addUser(formData: FormData): Promise<void> {
  const actor = await requireRole("admin");
  const email = normalizeEmail(formData.get("email"));
  const role = parseRole(formData.get("role"));
  const note = parseNote(formData.get("note"));

  if (!email) throw new Error("Invalid email");
  if (!role) throw new Error("Invalid role");

  const existing = await db.query.allowedUsers.findFirst({
    where: eq(schema.allowedUsers.email, email),
  });
  if (existing) throw new Error(`${email} is already in the allowlist`);

  await db.transaction(async (tx) => {
    await tx.insert(schema.allowedUsers).values({
      email,
      role,
      addedBy: actor.userId,
      note,
    });
    await tx.insert(schema.adminAudit).values({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "user.add",
      target: email,
      afterJson: { role, note },
    });
  });

  revalidatePath("/[locale]/admin/users", "page");
}

export async function changeUserRole(formData: FormData): Promise<void> {
  const actor = await requireRole("admin");
  const email = normalizeEmail(formData.get("email"));
  const newRole = parseRole(formData.get("role"));

  if (!email) throw new Error("Invalid email");
  if (!newRole) throw new Error("Invalid role");

  const current = await db.query.allowedUsers.findFirst({
    where: eq(schema.allowedUsers.email, email),
  });
  if (!current) throw new Error("User not found");
  if (current.role === newRole) return;

  if (email === actor.email && newRole !== "admin") {
    throw new Error("You can't demote yourself");
  }

  if (current.role === "admin" && newRole !== "admin") {
    const isLast = await lastAdminCheck(email);
    if (isLast) throw new Error("Can't demote the last admin");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(schema.allowedUsers)
      .set({ role: newRole })
      .where(eq(schema.allowedUsers.email, email));
    await tx.insert(schema.adminAudit).values({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "user.role_change",
      target: email,
      beforeJson: { role: current.role },
      afterJson: { role: newRole },
    });
  });

  revalidatePath("/[locale]/admin/users", "page");
}

export async function removeUser(formData: FormData): Promise<void> {
  const actor = await requireRole("admin");
  const email = normalizeEmail(formData.get("email"));

  if (!email) throw new Error("Invalid email");

  const current = await db.query.allowedUsers.findFirst({
    where: eq(schema.allowedUsers.email, email),
  });
  if (!current) throw new Error("User not found");

  if (email === actor.email) {
    throw new Error("You can't remove yourself");
  }

  if (current.role === "admin") {
    const isLast = await lastAdminCheck(email);
    if (isLast) throw new Error("Can't remove the last admin");
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.allowedUsers)
      .where(eq(schema.allowedUsers.email, email));
    await tx.insert(schema.adminAudit).values({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "user.remove",
      target: email,
      beforeJson: {
        role: current.role,
        addedBy: current.addedBy,
        addedAt: current.addedAt,
        note: current.note,
      },
    });
  });

  revalidatePath("/[locale]/admin/users", "page");
}
