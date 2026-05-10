"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function login(e: React.FormEvent) {
    e.preventDefault();

    document.cookie = `admin_auth=${password}; path=/; max-age=86400`;

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f6f8] p-6 text-black">
      <form
        onSubmit={login}
        className="w-full max-w-md rounded-[32px] border border-black/10 bg-white p-8 shadow-sm"
      >
        <p className="mb-2 text-sm font-bold text-black/50">
          Online Showroom Admin
        </p>

        <h1 className="mb-6 text-4xl font-bold tracking-tight">
          Admin Login
        </h1>

        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="Enter admin password"
          className="mb-4 h-14 w-full rounded-2xl border border-black/15 px-5 outline-none"
        />

        {error && <p className="mb-4 text-sm font-bold text-red-600">{error}</p>}

        <button
          type="submit"
          className="h-14 w-full rounded-full bg-[#732b97] font-bold text-white"
        >
          Login
        </button>
      </form>
    </main>
  );
}