import { SdkCanvas } from "@/components/sdk/SdkCanvas";
import { redirect } from "next/navigation";

export default async function SdkPage({ searchParams }: PageProps<"/sdk">) {
  const params = await searchParams;
  if (params.view === "docs") redirect("/sdk/docs");
  return <SdkCanvas />;
}
