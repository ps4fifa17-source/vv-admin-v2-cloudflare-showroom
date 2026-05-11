"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

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
  const [reg, setReg] = useState("");
  const [price, setPrice] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuel, setFuel] = useState("");
  const [gearbox, setGearbox] = useState("");
  const [body, setBody] = useState("");
  const [teaserVideo, setTeaserVideo] = useState("");
  const [walkaroundVideo, setWalkaroundVideo] = useState("");
  const [published, setPublished] = useState(false);
  const [clips, setClips] = useState<InspectClip[]>(defaultClips);

  useEffect(() => {
    async function load() {
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

      const vehicle = data?.[0];

      if (vehicle) {
        setTitle(vehicle.title || "");
        setReg(vehicle.reg || "");
        setPrice(vehicle.price || "");
        setMileage(vehicle.mileage || "");
        setFuel(vehicle.fuel || "Petrol");
        setGearbox(vehicle.gearbox || "Manual");
        setBody(vehicle.body || "Hatchback");
        setTeaserVideo(vehicle.teaser_video || "");
        setWalkaroundVideo(vehicle.walkaround_video || "");
        setPublished(Boolean(vehicle.published));
      }

      const { data: clipData } = await supabase
        .from("vehicle_inspect_clips")
        .select("*")
        .eq("vehicle_id", id)
        .order("position", { ascending: true });

      const merged = defaultClips.map((base) => {
        const found = clipData?.find((x) => x.label === base.label);

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
      setLoading(false);
    }

    load();
  }, [id]);

  async function uploadFile(file: File) {
    const req = await fetch("/api/cloudflare-upload", { method: "POST" });
    const d = await req.json();

    if (!d.success) {
      throw new Error(d.error || "Could not create Cloudflare upload URL");
    }

    const fd = new FormData();
    fd.append("file", file);

    const up = await fetch(d.uploadURL, { method: "POST", body: fd });

    if (!up.ok) {
      throw new Error("Video upload failed");
    }

    return d.uid as string;
  }

  async function handleVehicleVideoSelected(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "teaser_video" | "walkaround_video"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);

      const uid = await uploadFile(file);

      if (field === "teaser_video") setTeaserVideo(uid);
      if (field === "walkaround_video") setWalkaroundVideo(uid);

      const { error } = await supabase
        .from("vehicles")
        .update({ [field]: uid })
        .eq("id", id);

      if (error) throw new Error(error.message);

      alert("Video uploaded and saved");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  }

  async function handleInspectSelected(
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) {
    const file = e.target.files?.[0];
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

      if (error) throw new Error(error.message);

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
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  }
async function removeInspectClip(index: number) {
  const clip = clips[index];

  if (!clip.id) return;

  if (!confirm(`Remove ${clip.label} clip?`)) return;

  const { error } = await supabase
    .from("vehicle_inspect_clips")
    .delete()
    .eq("id", clip.id);

  if (error) return alert(error.message);

  const updated = [...clips];
  updated[index] = {
    ...clip,
    id: undefined,
    cloudflare_video_id: "",
    cloudflare_preview_id: "",
  };

  setClips(updated);
}
  async function handleSave() {
    if (!title.trim()) return alert("Vehicle title is required");

    const canPublish = Boolean(teaserVideo && walkaroundVideo);

    setSaving(true);

    const { error } = await supabase
      .from("vehicles")
      .update({
        title,
        slug: createSlug(title),
        reg,
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

    if (error) return alert(error.message);

    alert("Vehicle updated successfully");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Remove this vehicle from showroom stock?")) return;

    setSaving(true);

    const { error } = await supabase.from("vehicles").delete().eq("id", id);

    setSaving(false);

    if (error) return alert(error.message);

    router.push("/");
  }

  if (loading) {
    return (
      <div className="ultimate-page">
        <div className="ultimate-panel">Loading vehicle...</div>
      </div>
    );
  }

  const ready = Boolean(teaserVideo && walkaroundVideo);

  return (
    <div className="ultimate-page">
      <section className="ultimate-hero">
        <div>
          <p className="ultimate-eyebrow">Video Showroom</p>
          <h1>Edit Vehicle</h1>
          <p className="ultimate-sub">
            {title || "Untitled vehicle"} · {reg || "No reg"}
          </p>
        </div>

        <div className="hero-actions">
          <Link href="/stock" className="soft-btn">
            <ArrowLeft size={17} /> Stock
          </Link>

          <button onClick={handleSave} disabled={saving} className="purple-btn">
            <Save size={17} /> {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </section>

      <section className="ultimate-grid-two">
        <div className="ultimate-panel form-panel">
          <div className="form-intro">
            <div>
              <p className="ultimate-eyebrow dark">Stock details</p>
              <h2>Vehicle details</h2>
              <p>Imported stock can be adjusted before publishing.</p>
            </div>
          </div>

          <div className="form-grid">
            <Field label="Registration">
              <input
                value={reg}
                onChange={(e) => setReg(e.target.value.toUpperCase())}
              />
            </Field>

            <Field label="Title">
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>

            <Field label="Price">
              <input value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>

            <Field label="Mileage">
              <input
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
              />
            </Field>

            <Field label="Fuel">
              <input value={fuel} onChange={(e) => setFuel(e.target.value)} />
            </Field>

            <Field label="Gearbox">
              <input
                value={gearbox}
                onChange={(e) => setGearbox(e.target.value)}
              />
            </Field>

            <Field label="Body">
              <input value={body} onChange={(e) => setBody(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="ultimate-panel">
          <div className="publish-card">
            <p className="ultimate-eyebrow dark">Status</p>
            <h2>Publish control</h2>

            <p>
              {ready
                ? "This vehicle has the required videos and can go live."
                : "Upload a portrait teaser and landscape walkaround before publishing."}
            </p>

            <button
              type="button"
              onClick={() => setPublished((prev) => !prev)}
              className={`publish-status-btn ${
                published ? "is-live" : "is-draft"
              }`}
            >
              <span>{published ? "Live" : "Draft"}</span>
              <strong>
                {published ? "Published to showroom" : "Click to publish"}
              </strong>
            </button>

            {!ready && published && (
              <div className="publish-warning">
                <AlertTriangle size={16} />
                Required videos missing. It will stay unpublished until complete.
              </div>
            )}

            <button
              onClick={handleDelete}
              disabled={saving}
              className="danger-btn"
            >
              <Trash2 size={17} /> Remove from showroom
            </button>
          </div>
        </div>
      </section>

      <section className="ultimate-panel">
        <div className="panel-head">
          <div>
            <p className="ultimate-eyebrow dark">Required</p>
            <h2>Main videos</h2>
          </div>

          {ready && (
            <span className="status live">
              <CheckCircle2 size={14} /> Ready
            </span>
          )}
        </div>

        <div className="video-upload-grid">
          <VideoUpload
            label="Portrait homepage/card teaser"
            buttonText="Upload Portrait Teaser"
            inputId="portrait-upload"
            value={teaserVideo}
            saving={saving}
            onChange={(e) => handleVehicleVideoSelected(e, "teaser_video")}
          />

          <VideoUpload
            label="Landscape main walkaround"
            buttonText="Upload Landscape Walkaround"
            inputId="walkaround-upload"
            value={walkaroundVideo}
            saving={saving}
            onChange={(e) => handleVehicleVideoSelected(e, "walkaround_video")}
          />
        </div>
      </section>

      <section className="ultimate-panel">
        <div className="panel-head">
          <div>
            <p className="ultimate-eyebrow dark">Optional</p>
            <h2>Inspection clips</h2>
            <p className="section-sub">
              Only uploaded clips will show on the public showroom.
            </p>
          </div>
        </div>

        <div className="inspect-upload-grid">
          {clips.map((clip, index) => (
            <div key={clip.label} className="inspect-upload-card">
              <h3>{clip.label}</h3>
              <p>{clip.cloudflare_video_id ? "Uploaded" : "Not uploaded"}</p>

              <div className="clip-actions">
  <button
    type="button"
    disabled={saving}
    onClick={() => document.getElementById(`inspect-${index}`)?.click()}
    className={clip.cloudflare_video_id ? "clip-btn uploaded" : "clip-btn"}
  >
    <UploadCloud size={16} />
    {saving
      ? "Uploading..."
      : clip.cloudflare_video_id
      ? "Replace"
      : `Upload ${clip.label}`}
  </button>

  {clip.cloudflare_video_id && (
    <button
      type="button"
      onClick={() => removeInspectClip(index)}
      className="clip-remove-btn"
    >
      Remove
    </button>
  )}
</div>

              <input
                id={`inspect-${index}`}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleInspectSelected(e, index)}
              />

              <input
                value={clip.cloudflare_video_id}
                readOnly
                placeholder="Cloudflare ID appears here"
                className="id-input"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function VideoUpload({
  label,
  buttonText,
  inputId,
  value,
  saving,
  onChange,
}: {
  label: string;
  buttonText: string;
  inputId: string;
  value: string;
  saving: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const uploaded = Boolean(value);

  return (
    <div className="video-upload-card">
      <div>
        <h3>{label}</h3>
        <p>{uploaded ? "Video saved to Cloudflare" : "No video uploaded yet"}</p>
      </div>

      {uploaded && <span className="status live">Uploaded</span>}

      <button
        type="button"
        onClick={() => document.getElementById(inputId)?.click()}
        disabled={saving}
        className={uploaded ? "soft-btn uploaded" : "purple-btn"}
      >
        <UploadCloud size={17} />{" "}
        {saving ? "Uploading..." : uploaded ? "Change video" : buttonText}
      </button>

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
        placeholder="Cloudflare video ID appears here"
        className="id-input"
      />
    </div>
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
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}