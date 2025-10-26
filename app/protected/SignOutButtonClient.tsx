"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut(e: React.FormEvent) {
    e.preventDefault();
    await signOut({ redirect: false });
    router.push("/");
  }

  return (
    <form onSubmit={handleSignOut}>
      <button
        type="submit"
        className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition"
      >
        Sign out
      </button>
    </form>
  );
}
