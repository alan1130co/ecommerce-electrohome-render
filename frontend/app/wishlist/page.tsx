import { redirect } from "next/navigation";

import WishlistGrid from "@/components/product/WishlistGrid";
import { userApiGetSafe } from "@/lib/api-user";
import type { WishlistSummary } from "@/lib/types";

export default async function WishlistPage() {
  const result = await userApiGetSafe<WishlistSummary>("/api/wishlist/");
  if (!result.ok) {
    redirect("/cuenta/login?next=/wishlist");
  }

  return <WishlistGrid initialSummary={result.data} />;
}
