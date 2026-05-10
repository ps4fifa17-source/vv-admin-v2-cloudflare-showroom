 "use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AddVehiclePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuel, setFuel] = useState("Petrol");
  const [gearbox, setGearbox] = useState("Manual");
  const [body, setBody] = useState("Hatchback");
  const [reg, setReg] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      alert("Vehicle title is required");
      return;
    }

    setSaving(true);

    const slug = createSlug(title);

    const { data, error } = await supabase
      .from("vehicles")
      .insert([
        {
          title: title.trim(),
          slug,
          price: price.trim(),
          mileage: mileage.trim(),
          fuel,
          gearbox,
          body,
          reg: reg.trim().toUpperCase(),
          published: false,
        },
      ])
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/edit-vehicle/${data.id}`);
  }

  return (
    <main className="min-h-screen bg-[#f6f6f8] p-10 text-black">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="mb-2 font-semibold text-black/50">
              Vehicle Management
            </p>
            <h1 className="text-5xl font-bold tracking-tight">Add Vehicle</h1>
            <p className="mt-3 max-w-xl text-black/50">
              Add the basic vehicle details first. You’ll upload the portrait teaser,
              walkaround and inspection clips on the next screen.
            </p>
          </div>

          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-full bg-black px-6 font-bold text-white"
          >
            Dashboard
          </Link>
        </div>

        <section className="rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
          <div className="mb-8 rounded-[28px] bg-black p-7 text-white">
            <p className="text-sm font-semibold text-white/55">Step 1</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Vehicle details
            </h2>
            <p className="mt-2 text-white/60">
              This creates the draft stock record. It won’t appear on the customer
              website until videos are uploaded and published.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Registration">
              <input
                value={reg}
                onChange={(e) => setReg(e.target.value.toUpperCase())}
                placeholder="EA19 ABC"
                className="h-14 w-full rounded-2xl border border-black/15 bg-white px-5 outline-none focus:border-[#732b97]"
              />
            </Field>

            <Field label="Vehicle Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mini Countryman"
                className="h-14 w-full rounded-2xl border border-black/15 bg-white px-5 outline-none focus:border-[#732b97]"
              />
            </Field>

            <Field label="Price">
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="£8,995"
                className="h-14 w-full rounded-2xl border border-black/15 bg-white px-5 outline-none focus:border-[#732b97]"
              />
            </Field>

            <Field label="Mileage">
              <input
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="28,000"
                className="h-14 w-full rounded-2xl border border-black/15 bg-white px-5 outline-none focus:border-[#732b97]"
              />
            </Field>

            <Select
              label="Fuel"
              value={fuel}
              setValue={setFuel}
              options={["Petrol", "Diesel", "Hybrid", "Plug-in Hybrid", "Electric"]}
            />

            <Select
              label="Gearbox"
              value={gearbox}
              setValue={setGearbox}
              options={["Manual", "Automatic", "Semi-Auto"]}
            />

            <Select
              label="Body Type"
              value={body}
              setValue={setBody}
              options={[
                "Hatchback",
                "SUV",
                "Saloon",
                "Coupe",
                "Convertible",
                "Estate",
                "MPV",
                "Pickup",
                "Van",
              ]}
            />
          </div>

          <div className="mt-8 flex items-center justify-between rounded-[24px] bg-[#f6f6f8] p-5">
            <div>
              <p className="font-bold">Save as draft</p>
              <p className="text-sm text-black/50">
                After saving, you’ll be taken to the upload screen.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="h-14 rounded-full bg-[#732b97] px-8 font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Vehicle"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      {children}
    </div>
  );
}

function Select({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-14 w-full rounded-2xl border border-black/15 bg-white px-5 outline-none focus:border-[#732b97]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
