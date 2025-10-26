export const runtime = "nodejs"; // ✅ fix: force Node runtime

import SignOutButton from "../protected/SignOutButtonClient";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <SignOutButton />
        </div>
        <div className="bg-gray-900 rounded-lg p-6">
          <p className="text-lg mb-4">Welcome back!</p>
        </div>
      </div>
    </div>
  );
}
