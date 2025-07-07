import Link from "next/link";

export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">OneFoodDialer</h1>
      <p className="mt-2">
        Simplified platform for subscription-based food businesses.
      </p>
      <div className="mt-4 space-x-4">
        <Link href="/admin" className="text-blue-600 underline">
          Go to Admin Panel
        </Link>
        <Link href="/customer" className="text-green-600 underline">
          Customer View
        </Link>
      </div>
    </main>
  );
}
// This is the main page of the OneFoodDialer application.
