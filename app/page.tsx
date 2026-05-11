import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Car,
  Eye,
  Clock3,
  CheckCircle2,
  Film,
  ArrowRight,
  Plus,
  BarChart3,
} from "lucide-react";
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const { data: dealerData } = await supabase
    .from("dealers")
    .select("*")
    .limit(1);
  const { data: vehicleData } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });
  const dealer = dealerData?.[0] || null;
  const vehicles = vehicleData || [];
  const published = vehicles.filter((v: any) => v.published).length;
  const drafts = vehicles.filter((v: any) => !v.published).length;
  const ready = vehicles.filter(
    (v: any) => v.teaser_video && v.walkaround_video && !v.published,
  ).length;
  const videoReady = vehicles.filter(
    (v: any) => v.teaser_video && v.walkaround_video,
  ).length;
  return (
    <div className="ultimate-page">
      <section className="ultimate-hero">
        <div>
          <p className="ultimate-eyebrow">Control Centre</p>
          <h1>Dashboard</h1>
          <p className="ultimate-sub">
            Manage live stock, upload walkarounds and publish cars into your
            video showroom.
          </p>
        </div>
        <div className="hero-actions">
          <Link href="/insights" className="soft-btn">
            <BarChart3 size={17} /> Insights
          </Link>
          <Link href="/stock" className="purple-btn">
            <Plus size={17} /> Import stock
          </Link>
        </div>
      </section>
      <section className="metric-grid">
        <Metric
          title="Total stock"
          value={vehicles.length}
          icon={<Car size={18} />}
        />
        <Metric
          title="Published"
          value={published}
          icon={<Eye size={18} />}
          tone="green"
        />
        <Metric
          title="Drafts"
          value={drafts}
          icon={<Clock3 size={18} />}
          tone="orange"
        />
        <Metric
          title="Ready"
          value={ready}
          icon={<CheckCircle2 size={18} />}
          tone="purple"
        />
      </section>
      <section className="ultimate-grid-two">
        <div className="ultimate-panel">
          <div className="panel-head">
            <div>
              <p className="ultimate-eyebrow dark">Video Showroom</p>
              <h2>Vehicles</h2>
            </div>
            <Link href="/stock" className="text-link">
              Live stock <ArrowRight size={16} />
            </Link>
          </div>
          <div className="stock-list">
            {vehicles.slice(0, 7).map((car: any) => (
              <Link
                href={`/edit-vehicle/${car.id}`}
                key={car.id}
                className="stock-row"
              >
                <div>
                  <strong>{car.title || "Untitled vehicle"}</strong>
                  <span>
                    {car.price || "No price"} ·{" "}
                    {car.published
                      ? "Live"
                      : car.teaser_video && car.walkaround_video
                        ? "Ready draft"
                        : "Needs videos"}
                  </span>
                </div>
                <em className={car.published ? "status live" : "status draft"}>
                  {car.published ? "Live" : "Draft"}
                </em>
              </Link>
            ))}
          </div>
        </div>
        <div
  className="ultimate-panel"
  style={{
    background: "#732b97",
    color: "white",
  }}
>
          <Film size={30} />
          <h2>Showroom status</h2>
          <p>
            {videoReady}/{vehicles.length} vehicles have the core videos
            uploaded.
          </p>
          <div className="check-list">
            <span className={dealer?.homepage_video ? "done" : ""}>
              Homepage intro video
            </span>
            <span className={vehicles.length > 0 ? "done" : ""}>
              Stock imported
            </span>
            <span className={published > 0 ? "done" : ""}>
              Live stock published
            </span>
          </div>
          <Link href="/settings" className="white-btn">
            Settings
          </Link>
        </div>
      </section>
    </div>
  );
}
function Metric({
  title,
  value,
  icon,
  tone = "default",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  tone?: "default" | "green" | "orange" | "purple";
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <p>{title}</p>
      <h3>{value}</h3>
    </div>
  );
}
