 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type InspectClip = {
  id?: string;
  vehicle_id?: string;
  label: string;
  icon: string;
  cloudflare_video_id: string;
  cloudflare_preview_id?: string;
  position: number;
};

const defaultClips: InspectClip[] = [
  { label: "Interior", icon: "seat", cloudflare_video_id: "", position: 1 },
  { label: "Wheels", icon: "wheel", cloudflare_video_id: "", position: 2 },
  { label: "Front", icon: "front", cloudflare_video_id: "", position: 3 },
  { label: "Rear", icon: "rear", cloudflare_video_id: "", position: 4 },
  { label: "Condition", icon: "shield", cloudflare_video_id: "", position: 5 },
];

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuel, setFuel] = useState("Petrol");
  const [gearbox, setGearbox] = useState("Manual");
  const [body, setBody] = useState("Hatchback");

  const [teaserVideo, setTeaserVideo] = useState("");
  const [walkaroundVideo, setWalkaroundVideo] = useState("");
  const [published, setPublished] = useState(false);

  const [clips, setClips] = useState<InspectClip[]>(defaultClips);

  useEffect(() => {
    async function loadVehicle() {
      setLoading(true);

      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .limit(1);

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const vehicle = data[0];

        setTitle(vehicle.title || "");
        setPrice(vehicle.price || "");
        setMileage(vehicle.mileage || "");
        setFuel(vehicle.fuel || "Petrol");
        setGearbox(vehicle.gearbox || "Manual");
        setBody(vehicle.body || "Hatchback");
        setTeaserVideo(vehicle.teaser_video || "");
        setWalkaroundVideo(vehicle.walkaround_video || "");
        setPublished(Boolean(vehicle.published));
      }

      const { data: clipData, error: clipError } = await supabase
        .from("vehicle_inspect_clips")
        .select("*")
        .eq("vehicle_id", id)
        .order("position", { ascending: true });

      if (clipError) {
        alert(clipError.message);
      } else {
        const merged = defaultClips.map((base) => {
          const found = clipData?.find((clip) => clip.label === base.label);

          return found
            ? {
                id: found.id,
                vehicle_id: found.vehicle_id,
                label: found.label,
                icon: found.icon,
                cloudflare_video_id:
                  found.cloudflare_video_id || found.video_url || "",
                cloudflare_preview_id:
                  found.cloudflare_preview_id || found.preview_url || "",
                position: found.position || base.position,
              }
            : base;
        });

        setClips(merged);
      }

      setLoading(false);
    }

    if (id) {
      loadVehicle();
    }
  }, [id]);

  async function uploadFile(file: File) {
    const request = await fetch("/api/cloudflare-upload", {
      method: "POST",
    });

    const data = await request.json();

    if (!data.success) {
      throw new Error(data.error || "Could not create Cloudflare upload URL");
    }

    const formData = new FormData();
    formData.append("file", file);

    const upload = await fetch(data.uploadURL, {
      method: "POST",
      body: formData,
    });

    if (!upload.ok) {
      throw new Error("Video upload failed");
    }

    return data.uid as string;
  }

  async function handleVehicleVideoSelected(
    event: React.ChangeEvent<HTMLInputElement>,
    field: "teaser_video" | "walkaround_video"
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setSaving(true);

      const uid = await uploadFile(file);

      if (field === "teaser_video") {
        setTeaserVideo(uid);
      } else {
        setWalkaroundVideo(uid);
      }

      const { error } = await supabase
        .from("vehicles")
        .update({ [field]: uid })
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      alert("Video uploaded and saved");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  }

  async function removeVehicleVideo(field: "teaser_video" | "walkaround_video") {
    const label = field === "teaser_video" ? "teaser video" : "walkaround video";

    if (!confirm(`Remove this ${label}?`)) return;

    try {
      setSaving(true);

      if (field === "teaser_video") {
        setTeaserVideo("");
      } else {
        setWalkaroundVideo("");
      }

      const { error } = await supabase
        .from("vehicles")
        .update({ [field]: "", published: false })
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      setPublished(false);
      alert(`${label} removed`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not remove video");
    } finally {
      setSaving(false);
    }
  }

  async function handleInspectSelected(
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setSaving(true);

      const uid = await uploadFile(file);
      const clip = clips[index];

      const { data, error } = await supabase
        .from("vehicle_inspect_clips")
        .upsert({
          id: clip.id,
          vehicle_id: id,
          label: clip.label,
          icon: clip.icon,
          cloudflare_video_id: uid,
          cloudflare_preview_id: uid,
          video_url: uid,
          preview_url: uid,
          position: clip.position,
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const updated = [...clips];

      updated[index] = {
        ...clip,
        id: data.id,
        vehicle_id: id,
        cloudflare_video_id: uid,
        cloudflare_preview_id: uid,
      };

      setClips(updated);
      alert(`${clip.label} clip uploaded and saved`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  }

  async function removeInspectClip(index: number) {
    const clip = clips[index];

    if (!clip.cloudflare_video_id) return;
    if (!confirm(`Remove ${clip.label} clip?`)) return;

    try {
      setSaving(true);

      if (clip.id) {
        const { error } = await supabase
          .from("vehicle_inspect_clips")
          .delete()
          .eq("id", clip.id);

        if (error) {
          throw new Error(error.message);
        }
      }

      const updated = [...clips];

      updated[index] = {
        ...clip,
        id: undefined,
        vehicle_id: undefined,
        cloudflare_video_id: "",
        cloudflare_preview_id: "",
      };

      setClips(updated);
      alert(`${clip.label} clip removed`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not remove clip");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      alert("Vehicle title is required");
      return;
    }

    setSaving(true);

    const canPublish = Boolean(teaserVideo && walkaroundVideo);

    const { error } = await supabase
      .from("vehicles")
      .update({
        title,
        slug: createSlug(title),
        price,
        mileage,
        fuel,
        gearbox,
        body,
        teaser_video: teaserVideo,
        walkaround_video: walkaroundVideo,
        published: published && canPublish,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (published && !canPublish) {
      alert("Saved, but not published because teaser and walkaround are required.");
    } else {
      alert("Vehicle updated successfully");
    }

    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Remove this vehicle from stock?")) return;

    setSaving(true);

    const { error } = await supabase.from("vehicles").delete().eq("id", id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
  }

  if (loading) {
    return <main className="min-h-screen bg-white p-10 text-black">Loading vehicle...</main>;
  }

  return (
    <main className="min-h-screen bg-white p-10 text-black">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="mb-2 font-semibold text-black/50">Vehicle Management</p>
            <h1 className="text-5xl font-bold tracking-tight">Edit Vehicle</h1>
          </div>

          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-full bg-black px-6 font-bold text-white"
          >
            Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <section className="col-span-2 rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold">Vehicle details</h2>

            <div className="grid grid-cols-2 gap-5">
              <Input label="Vehicle Title" value={title} setValue={setTitle} full />
              <Input label="Price" value={price} setValue={setPrice} />
              <Input label="Mileage" value={mileage} setValue={setMileage} />

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
                full
              />
            </div>
          </section>

          <section className="rounded-[32px] border border-black/10 bg-[#f6f6f8] p-6">
            <h2 className="mb-4 text-2xl font-bold">Publish status</h2>

            <p className="mb-6 text-black/55">
              Only publish once portrait teaser and landscape walkaround are uploaded.
            </p>

            <label className="flex items-center gap-3 font-bold">
              <input
                type="checkbox"
                checked={published}
                onChange={(event) => setPublished(event.target.checked)}
                className="h-5 w-5"
              />
              Publish vehicle
            </label>

            {published && (!teaserVideo || !walkaroundVideo) && (
              <p className="mt-4 text-sm font-semibold text-red-600">
                Add both required videos before this can go live.
              </p>
            )}

            <button
              onClick={handleDelete}
              disabled={saving}
              className="mt-8 h-12 w-full rounded-full border border-red-200 bg-red-50 px-5 font-bold text-red-700 disabled:opacity-100"
            >
              Remove from stock
            </button>
          </section>

          <section className="col-span-3 rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
            <h2 className="mb-2 text-2xl font-bold">Required showroom videos</h2>

            <p className="mb-6 text-black/50">
              Only the teaser is portrait. Walkaround and all inspection clips are landscape.
            </p>

            <div className="grid grid-cols-2 gap-5">
              <VideoUpload
                label="Portrait homepage/card teaser"
                buttonText="Upload Portrait Teaser"
                inputId="portrait-upload"
                value={teaserVideo}
                saving={saving}
                onChange={(event) => handleVehicleVideoSelected(event, "teaser_video")}
                onRemove={() => removeVehicleVideo("teaser_video")}
              />

              <VideoUpload
                label="Landscape main walkaround"
                buttonText="Upload Landscape Walkaround"
                inputId="walkaround-upload"
                value={walkaroundVideo}
                saving={saving}
                onChange={(event) => handleVehicleVideoSelected(event, "walkaround_video")}
                onRemove={() => removeVehicleVideo("walkaround_video")}
              />
            </div>
          </section>

          <section className="col-span-3 rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
            <h2 className="mb-2 text-2xl font-bold">Inspection clips</h2>

            <p className="mb-6 text-black/50">
              Upload only the sections you have. Missing clips will not show on the customer website.
            </p>

            <div className="grid grid-cols-3 gap-5">
              {clips.map((clip, index) => (
                <div
                  key={clip.label}
                  className="rounded-3xl border border-black/10 bg-[#f6f6f8] p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold">{clip.label}</h3>
                      <p className="mt-1 text-sm text-black/50">
                        {clip.cloudflare_video_id ? "Uploaded" : "Not uploaded"}
                      </p>
                    </div>

                    {clip.cloudflare_video_id && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        ✓ Saved
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => document.getElementById(`inspect-${index}`)?.click()}
                    className={`mb-3 h-11 rounded-2xl px-4 font-bold disabled:opacity-100 ${
                      saving
                        ? "bg-yellow-100 text-black border border-yellow-300"
                        : clip.cloudflare_video_id
                        ? "bg-green-600 text-white"
                        : "bg-[#732b97] text-white"
                    }`}
                  >
                    {saving
                      ? "Uploading..."
                      : clip.cloudflare_video_id
                      ? `Change ${clip.label}`
                      : `Upload ${clip.label}`}
                  </button>

                  {clip.cloudflare_video_id && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => removeInspectClip(index)}
                      className="mb-4 ml-2 h-11 rounded-2xl border border-red-200 bg-red-50 px-4 font-bold text-red-700 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  )}

                  <input
                    id={`inspect-${index}`}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(event) => handleInspectSelected(event, index)}
                  />

                  <input
                    value={clip.cloudflare_video_id}
                    readOnly
                    placeholder="Cloudflare ID appears here"
                    className="h-12 w-full rounded-2xl border border-black/15 bg-white px-4 text-xs outline-none"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-8 h-14 rounded-full bg-[#732b97] px-8 font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving / uploading..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}

function VideoUpload({
  label,
  buttonText,
  inputId,
  value,
  saving,
  onChange,
  onRemove,
}: {
  label: string;
  buttonText: string;
  inputId: string;
  value: string;
  saving: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const uploaded = Boolean(value);

  return (
    <div className="rounded-3xl border border-black/10 bg-[#f6f6f8] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <label className="block text-sm font-semibold">{label}</label>

          <p className="mt-1 text-xs text-black/50">
            {uploaded ? "Video saved to Cloudflare" : "No video uploaded yet"}
          </p>
        </div>

        {uploaded && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            ✓ Uploaded
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => document.getElementById(inputId)?.click()}
        disabled={saving}
        className={`mb-4 h-12 rounded-2xl px-5 font-bold text-white disabled:opacity-60 ${
          uploaded ? "bg-green-600" : "bg-[#732b97]"
        }`}
      >
        {saving ? "Uploading..." : uploaded ? "Change video" : buttonText}
      </button>

      {uploaded && (
        <button
          type="button"
          onClick={onRemove}
          disabled={saving}
          className="mb-4 ml-3 h-12 rounded-2xl border border-red-200 bg-red-50 px-5 font-bold text-red-700 disabled:opacity-60"
        >
          Remove
        </button>
      )}

      <input
        id={inputId}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onChange}
      />

      <input
        value={value}
        readOnly
        placeholder="Cloudflare video ID appears here after upload"
        className="h-14 w-full rounded-2xl border border-black/15 bg-white px-5 text-xs outline-none"
      />
    </div>
  );
}

function Input({
  label,
  value,
  setValue,
  full = false,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-14 w-full rounded-2xl border border-black/15 px-5 outline-none"
      />
    </div>
  );
}

function Select({
  label,
  value,
  setValue,
  options,
  full = false,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <select
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-14 w-full rounded-2xl border border-black/15 px-5 outline-none"
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
