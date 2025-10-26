import { auth } from "app/auth";
import { redirect } from "next/navigation";
import SignOutButton from "./SignOutButtonClient";

export default async function ProtectedPage() {
  // Use the exported auth() helper from app/auth to get the server session
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error("auth() failed in protected page:", err);
    return redirect("/login");
  }

  if (!session) {
    return redirect("/login");
  }

  // Display protected content until dashboard is merged
  return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center space-y-5">
        <p>You are logged in as {session.user?.email}</p>
        <SignOutButton />
      </div>
    </div>
  );
}
