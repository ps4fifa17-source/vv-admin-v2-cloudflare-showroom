import { supabase } from "@/lib/supabase";
import {
  BarChart3,
  MessageCircle,
  Phone,
  TrendingUp,
  Eye,
  MonitorPlay,
  MousePointerClick,
  Clock3,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*");

  const { data: events } = await supabase
    .from("showroom_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  const allEvents = events || [];
  const liveCars = (vehicles || []).filter(
    (v: any) => v.published
  ).length;

  const count = (type: string) =>
    allEvents.filter(
      (e: any) => e.event_type === type
    ).length;

  const views = count("vehicle_view");
  const interests = count("interest_click");
  const calls = count("call_click");
  const cinema = count("cinema_open");
  const inspect = count("inspect_clip_open");
  const soundOns = count("walkaround_sound_on");

  const vehicleStats = buildVehicleStats(allEvents);

  return (
    <div className="ultimate-page">

      <section className="ultimate-hero">
        <div>
          <p className="ultimate-eyebrow">
            Showroom Insights
          </p>

          <h1>Insights</h1>

          <p className="ultimate-sub">
            Live showroom performance:
            views, enquiries, calls
            and video engagement.
          </p>
        </div>
      </section>

      <section className="metric-grid">

        <Metric
          title="Live cars"
          value={liveCars}
          icon={<TrendingUp size={18} />}
          tone="green"
        />

        <Metric
          title="Car views"
          value={views}
          icon={<Eye size={18} />}
          tone="purple"
        />

        <Metric
          title="Interested clicks"
          value={interests}
          icon={<MessageCircle size={18} />}
        />

        <Metric
          title="Call clicks"
          value={calls}
          icon={<Phone size={18} />}
        />

      </section>

      <section className="metric-grid">

        <Metric
          title="Cinema opens"
          value={cinema}
          icon={<MonitorPlay size={18} />}
          tone="purple"
        />

        <Metric
          title="Inspect taps"
          value={inspect}
          icon={<MousePointerClick size={18} />}
        />

        <Metric
          title="Sound enabled"
          value={soundOns}
          icon={<BarChart3 size={18} />}
        />

        <Metric
          title="Events logged"
          value={allEvents.length}
          icon={<Clock3 size={18} />}
          tone="orange"
        />

      </section>

      <section className="ultimate-grid-two">

        <div className="ultimate-panel">

          <div className="panel-head">
            <div>
              <p className="ultimate-eyebrow dark">
                Best performers
              </p>

              <h2>Top vehicles</h2>
            </div>
          </div>

          <div className="insight-list">

            {vehicleStats.slice(0, 8).map((car) => (
              <div
                className="insight-row"
                key={car.key}
              >
                <div>
                  <strong>{car.title}</strong>

                  <span>
                    {car.views} views ·{" "}
                    {car.interests} interested ·{" "}
                    {car.calls} calls
                  </span>
                </div>

                <em>{car.score} score</em>
              </div>
            ))}

            {vehicleStats.length === 0 && (
              <div className="empty-state">
                <h3>No activity yet</h3>

                <p>
                  Open the public showroom
                  and click around to generate
                  live data.
                </p>
              </div>
            )}

          </div>
        </div>

        <div className="ultimate-panel">

          <div className="panel-head">
            <div>
              <p className="ultimate-eyebrow dark">
                Live activity
              </p>

              <h2>Recent events</h2>
            </div>
          </div>

          <div className="insight-list">

            {allEvents.slice(0, 12).map((event: any) => (
              <div
                className="insight-row"
                key={event.id}
              >
                <div>

                  <strong>
                    {formatEvent(event.event_type)}
                  </strong>

                  <span>
                    {event.vehicle_title ||
                      event.vehicle_slug ||
                      "Showroom"}
                  </span>

                </div>

                <em>
                  {formatDate(event.created_at)}
                </em>
              </div>
            ))}

            {allEvents.length === 0 && (
              <div className="empty-state">
                <h3>No events logged</h3>

                <p>
                  Frontend tracking needs
                  to be live first.
                </p>
              </div>
            )}

          </div>
        </div>

      </section>
    </div>
  );
}

function buildVehicleStats(events: any[]) {
  const map = new Map();

  for (const event of events) {

    const key =
      event.vehicle_id ||
      event.vehicle_slug ||
      event.vehicle_title ||
      "unknown";

    if (!map.has(key)) {

      map.set(key, {
        key,
        title:
          event.vehicle_title ||
          event.vehicle_slug ||
          "Unknown vehicle",

        views: 0,
        interests: 0,
        calls: 0,
        cinema: 0,
        inspect: 0,
        sound: 0,
        score: 0,
      });
    }

    const item = map.get(key);

    if (event.event_type === "vehicle_view")
      item.views += 1;

    if (event.event_type === "interest_click")
      item.interests += 1;

    if (event.event_type === "call_click")
      item.calls += 1;

    if (event.event_type === "cinema_open")
      item.cinema += 1;

    if (event.event_type === "inspect_clip_open")
      item.inspect += 1;

    if (event.event_type === "walkaround_sound_on")
      item.sound += 1;

    item.score =
      item.views +
      item.cinema * 2 +
      item.inspect * 2 +
      item.sound * 2 +
      item.calls * 5 +
      item.interests * 6;
  }

  return Array.from(map.values()).sort(
    (a, b) => b.score - a.score
  );
}

function formatEvent(type: string) {

  const labels: Record<string, string> = {
    vehicle_view: "Vehicle viewed",
    interest_click: "Interested clicked",
    call_click: "Call clicked",
    cinema_open: "Cinema opened",
    cinema_close: "Cinema closed",
    inspect_clip_open: "Inspect clip opened",
    walkaround_sound_on: "Sound enabled",
    walkaround_sound_off: "Sound muted",
  };

  return labels[type] || type;
}

function formatDate(value: string) {

  if (!value) return "";

  return new Date(value).toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
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

      <div className="metric-icon">
        {icon}
      </div>

      <p>{title}</p>

      <h3>{value}</h3>

    </div>
  );
}