 "use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function SettingsPage(){
  const [dealerId,setDealerId]=useState(""); const [dealershipName,setDealershipName]=useState(""); const [logoUrl,setLogoUrl]=useState("");
  const [phone,setPhone]=useState(""); const [whatsapp,setWhatsapp]=useState(""); const [accentColor,setAccentColor]=useState("#732b97");
  const [homepageVideo,setHomepageVideo]=useState(""); const [homepageTitle,setHomepageTitle]=useState("Welcome to our online showroom");
  const [homepageSubtitle,setHomepageSubtitle]=useState("Step inside the car before you visit."); const [saving,setSaving]=useState(false);

  useEffect(()=>{async function load(){const {data,error}=await supabase.from("dealers").select("*").limit(1); if(error)return alert(error.message); if(data&&data.length>0){const d=data[0]; setDealerId(d.id); setDealershipName(d.dealership_name||""); setLogoUrl(d.logo_url||""); setPhone(d.phone||""); setWhatsapp(d.whatsapp||""); setAccentColor(d.accent_color||"#732b97"); setHomepageVideo(d.homepage_video||""); setHomepageTitle(d.homepage_video_title||"Welcome to our online showroom"); setHomepageSubtitle(d.homepage_video_subtitle||"Step inside the car before you visit.");}} load();},[]);

  async function uploadFile(file:File){const req=await fetch("/api/cloudflare-upload",{method:"POST"}); const d=await req.json(); if(!d.success)throw new Error(d.error||"Upload URL failed"); const fd=new FormData(); fd.append("file",file); const up=await fetch(d.uploadURL,{method:"POST",body:fd}); if(!up.ok)throw new Error("Video upload failed"); return d.uid as string;}
  async function handleHomepageVideoSelected(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0]; if(!file||!dealerId)return; try{setSaving(true); const uid=await uploadFile(file); setHomepageVideo(uid); const {error}=await supabase.from("dealers").update({homepage_video:uid}).eq("id",dealerId); if(error)throw new Error(error.message); alert("Homepage intro video uploaded and saved");}catch(err){alert(err instanceof Error?err.message:"Upload failed")}finally{setSaving(false); e.target.value="";}}
  async function handleSave(){if(!dealerId)return alert("Dealer record not found"); setSaving(true); const {error}=await supabase.from("dealers").update({dealership_name:dealershipName,logo_url:logoUrl,phone,whatsapp,accent_color:accentColor,homepage_video:homepageVideo,homepage_video_title:homepageTitle,homepage_video_subtitle:homepageSubtitle}).eq("id",dealerId); setSaving(false); if(error)return alert(error.message); alert("Settings saved");}

  return <main className="min-h-screen bg-white p-10 text-black"><div className="mx-auto max-w-5xl">
    <div className="mb-10 flex items-center justify-between"><div><p className="mb-2 font-semibold text-black/50">Dealership Settings</p><h1 className="text-5xl font-bold tracking-tight">Showroom settings</h1></div><Link href="/" className="flex h-12 items-center justify-center rounded-full bg-black px-6 font-bold text-white">Dashboard</Link></div>
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-black/10 bg-white p-8 shadow-sm"><h2 className="mb-6 text-2xl font-bold">Dealership branding</h2><div className="grid grid-cols-2 gap-5"><Input label="Dealership name" value={dealershipName} setValue={setDealershipName}/><Input label="Logo URL" value={logoUrl} setValue={setLogoUrl}/><Input label="Phone" value={phone} setValue={setPhone}/><Input label="WhatsApp" value={whatsapp} setValue={setWhatsapp}/><Input label="Accent colour" value={accentColor} setValue={setAccentColor}/></div></section>
      <section className="rounded-[32px] border border-black/10 bg-white p-8 shadow-sm"><h2 className="mb-2 text-2xl font-bold">Homepage intro video</h2><p className="mb-6 text-black/50">Upload the drone/welcome video shown at the top of the customer showroom.</p>
        <button type="button" disabled={saving} onClick={()=>document.getElementById("homepage-video-upload")?.click()} className="mb-4 h-12 rounded-2xl bg-[#732b97] px-5 font-bold text-white disabled:opacity-60">Upload Homepage Intro Video</button>
        <input id="homepage-video-upload" type="file" accept="video/*" className="hidden" onChange={handleHomepageVideoSelected}/>
        <div className="grid grid-cols-2 gap-5"><Input label="Cloudflare homepage video ID" value={homepageVideo} setValue={setHomepageVideo}/><Input label="Homepage title" value={homepageTitle} setValue={setHomepageTitle}/><div className="col-span-2"><label className="mb-2 block text-sm font-semibold">Homepage subtitle</label><textarea value={homepageSubtitle} onChange={(e)=>setHomepageSubtitle(e.target.value)} className="min-h-28 w-full rounded-2xl border border-black/15 p-5 outline-none"/></div></div>
      </section>
    </div><button onClick={handleSave} disabled={saving} className="mt-8 h-14 rounded-full bg-[#732b97] px-8 font-bold text-white disabled:opacity-60">{saving?"Saving...":"Save Settings"}</button>
  </div></main>
}
function Input({label,value,setValue}:{label:string;value:string;setValue:(v:string)=>void}){return <div><label className="mb-2 block text-sm font-semibold">{label}</label><input value={value} onChange={(e)=>setValue(e.target.value)} className="h-14 w-full rounded-2xl border border-black/15 px-5 outline-none"/></div>}
