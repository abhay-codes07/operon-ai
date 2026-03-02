import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth/options";

export function getAuthSession() {
  return getServerSession(authOptions);
}
