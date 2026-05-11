'use server'

import { revalidatePath } from "next/cache"
import { invalidateUsersCache } from "./queries"

export async function revalidateUsersPage() {
  await invalidateUsersCache()
  revalidatePath('/admin/users')
}
