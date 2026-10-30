import { redirect } from "next/navigation";

export default function ErrorGalleryLayout() {
  redirect("/dashboard/settings");
}
