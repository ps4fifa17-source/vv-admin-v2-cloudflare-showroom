import { NextResponse } from "next/server";
const DEALERKIT_URL = "https://valuevehicles.co.uk/wp-json/dealerkit/v1/search";
function cleanText(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function getAmount(v: any) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return cleanText(v);
  return `£${n.toLocaleString("en-GB")}`;
}
function firstImage(vehicle: any) {
  const images = vehicle?.media?.images || vehicle?.images || [];
  if (Array.isArray(images) && images.length > 0)
    return images[0]?.url || images[0]?.src || "";
  return "";
}
function normaliseVehicle(vehicle: any) {
  const manufacturer = vehicle?.manufacturer?.name || vehicle?.make || "";
  const model = vehicle?.model?.name || vehicle?.model || "";
  const derivative = vehicle?.derivative || vehicle?.variant || "";
  const title =
    vehicle?.title ||
    [manufacturer, model, derivative].filter(Boolean).join(" ");
  const reg =
    vehicle?.registration?.vrm || vehicle?.registration || vehicle?.reg || "";
  const cashPrice =
    vehicle?.prices?.cash?.amount ??
    vehicle?.prices?.cash_price ??
    vehicle?.cash_price ??
    vehicle?.price ??
    "";
  const slug = vehicle?.slug || vehicle?.url || "";
  return {
    sourceId: String(vehicle?.id || vehicle?.vehicle_id || reg || title),
    title: cleanText(title),
    reg: cleanText(reg).toUpperCase(),
    price: getAmount(cashPrice),
    mileage: vehicle?.mileage
      ? Number(vehicle.mileage).toLocaleString("en-GB")
      : "",
    fuel: cleanText(vehicle?.fuel_type || vehicle?.fuel || ""),
    gearbox: cleanText(vehicle?.transmission_type || vehicle?.gearbox || ""),
    body: cleanText(vehicle?.body_type || vehicle?.body || ""),
    year: cleanText(vehicle?.year || ""),
    colour: cleanText(vehicle?.colour || ""),
    image: firstImage(vehicle),
    status: cleanText(vehicle?.status || ""),
    slug: cleanText(slug),
    sourceUrl: slug ? `https://valuevehicles.co.uk/used-cars/${slug}` : "",
  };
}
export async function GET() {
  try {
    const response = await fetch(DEALERKIT_URL, {
      next: { revalidate: 60 },
      headers: {
        Accept: "application/json",
        "User-Agent": "Value Vehicles Showroom Admin",
      },
    });
    if (!response.ok)
      return NextResponse.json(
        { success: false, error: `DealerKit returned ${response.status}` },
        { status: 500 },
      );
    const json = await response.json();
    const raw =
  json?.data?.vehicles?.data ||
  json?.data?.vehicles ||
  json?.vehicles?.data ||
  json?.vehicles ||
  json?.data ||
  [];
    const vehicles = Array.isArray(raw)
  ? raw
      .map((item) => normaliseVehicle(item.vehicle || item))
      .filter((v) => v.title || v.reg)
  : [];
    return NextResponse.json({ success: true, vehicles });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Could not fetch live stock",
      },
      { status: 500 },
    );
  }
}
