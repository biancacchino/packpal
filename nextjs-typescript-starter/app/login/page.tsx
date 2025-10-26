import { auth } from "../auth"; // ✅ import from '@/auth', not 'app/auth'
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth(); // ✅ Works only in server component

  // If user is not logged in, redirect to login page
  if (!session) {
    redirect("/login");
  }

  // You can access user data like this:
  const user = session?.user;

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">
        Welcome back, {user?.name || "User"} 👋
      </h1>
      <p className="text-gray-600">You’re signed in with {user?.email}.</p>
    </div>
  );
}
