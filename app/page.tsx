import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

type Dealer = { dealership_name: string | null; accent_color: string | null; homepage_video: string | null; };
type Vehicle = { id:string; title:string|null; published:boolean|null; teaser_video:string|null; walkaround_video:string|null; created_at:string; };

export default async function Home() {
  const { data: dealerData } = await supabase.from("dealers").select("*").limit(1);
  const { data: vehicleData } = await supabase.from("vehicles").select("*").order("created_at", { ascending:false });
  const dealer = (dealerData?.[0] || null) as Dealer | null;
  const vehicles = (vehicleData || []) as Vehicle[];
  const accent = dealer?.accent_color || "#732b97";
  const published = vehicles.filter((v)=>v.published).length;
  const drafts = vehicles.filter((v)=>!v.published).length;
  const ready = vehicles.filter((v)=>v.teaser_video && v.walkaround_video && !v.published).length;

  return (
    <main className="min-h-screen bg-[#f6f6f8] text-black">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
          <div><p className="text-sm font-semibold text-black/50">Online Showroom Admin V2</p><h1 className="text-4xl font-bold tracking-tight">{dealer?.dealership_name || "Dealership Admin"}</h1></div>
          <div className="flex gap-3">
            <Link href="/settings" className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 font-bold"><Settings size={17}/> Settings</Link>
            <Link href="/add-vehicle" className="rounded-full px-6 py-3 font-bold text-white" style={{backgroundColor:accent}}>Add Vehicle</Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-8 py-10">
        <section className="mb-8 rounded-[32px] p-8 text-white" style={{background:`linear-gradient(135deg, ${accent}, #111)`}}>
          <p className="mb-3 text-white/70">Backend controls the customer showroom</p>
          <h2 className="max-w-4xl text-5xl font-bold tracking-tight">Upload videos, manage stock and publish vehicles live.</h2>
          <p className="mt-4 text-white/70">Homepage intro: {dealer?.homepage_video ? "uploaded" : "not uploaded yet"}</p>
        </section>
        <section className="mb-10 grid grid-cols-4 gap-5">
          <StatCard title="Total Vehicles" value={vehicles.length}/><StatCard title="Published" value={published}/><StatCard title="Drafts" value={drafts}/><StatCard title="Ready" value={ready}/>
        </section>
        <section className="overflow-hidden rounded-[32px] border border-black/10 bg-white">
          <div className="border-b border-black/10 p-6"><h2 className="text-2xl font-bold">Vehicles</h2><p className="text-black/50">Only published vehicles with a portrait teaser and landscape walkaround appear publicly.</p></div>
          {vehicles.length===0 ? <div className="p-10 text-center"><h3 className="mb-2 text-2xl font-bold">No vehicles added yet</h3><p className="mb-6 text-black/50">Add your first vehicle, upload videos, then publish.</p><Link href="/add-vehicle" className="inline-flex rounded-full px-6 py-3 font-bold text-white" style={{backgroundColor:accent}}>Add First Vehicle</Link></div> :
            vehicles.map((car)=><div key={car.id} className="flex items-center justify-between border-b border-black/10 p-6 last:border-b-0">
              <div><h3 className="text-xl font-bold">{car.title || "Untitled vehicle"}</h3><p className="text-sm text-black/50">{car.published ? "Published":"Draft"} · {car.teaser_video ? "Portrait teaser uploaded":"No portrait teaser"} · {car.walkaround_video ? "Landscape walkaround uploaded":"No walkaround"}</p></div>
              <div className="flex items-center gap-3"><Link href={`/edit-vehicle/${car.id}`} className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white">Edit</Link><span className={`rounded-full px-4 py-2 text-sm font-bold ${car.published ? "bg-green-100 text-green-700":"bg-orange-100 text-orange-700"}`}>{car.published ? "Live":"Draft"}</span></div>
            </div>)
          }
        </section>
      </div>
    </main>
  )
}
function StatCard({title,value}:{title:string;value:number}){return <div className="rounded-3xl border border-black/10 bg-white p-6"><p className="mb-3 text-sm font-semibold text-black/50">{title}</p><h3 className="text-5xl font-bold">{value}</h3></div>}
