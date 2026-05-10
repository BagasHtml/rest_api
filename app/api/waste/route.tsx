import { NextResponse } from "next/server";

const MASTER_SITES = {
  "JIS": { lat: -6.124, lng: 106.821 },
  "Monas": { lat: -6.175, lng: 106.827 },
  "GBK": { lat: -6.218, lng: 106.801 }
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const locationName = body.locationName || "Area Luar Jangkauan";
    const visitorEstimate = Number(body.visitorEstimate) || 0;

    const hfResponse = await fetch("https://alamdieng-waste-prediction-api.hf.space/", {
      method: "GET",
      cache: 'no-store'
    });

    const aiData = await hfResponse.json().catch(() => ({}));
    const siteKey = locationName as keyof typeof MASTER_SITES;
    
    let volume: number;

    if (locationName.toLowerCase().includes("jakarta pusat") && aiData.events_loaded) {
      volume = Number(aiData.events_loaded) * 2.5;
    } else {
      volume = (visitorEstimate / 1000) * 0.75;
      if (volume <= 0) volume = 2.0; 
    }

    const trucks = Math.ceil(volume / 5) || 1;
    const staff = trucks * 3;
    const weight = volume * 0.4;

    return NextResponse.json({
      status: "success",
      data: {
        location: locationName,
        coordinates: MASTER_SITES[siteKey] || { lat: -6.200, lng: 106.816 },
        metrics: {
          total_volume: `${volume.toFixed(1)} m3`,
          total_weight: `${weight.toFixed(1)} Ton`,
          required_trucks: trucks,
          required_staff: staff,
          total_man_hours: staff * 8
        },
        summary: `Sistem mendeteksi lokasi ${locationName}. Estimasi beban sampah sebesar ${weight.toFixed(1)} Ton. Diperlukan pengerahan ${trucks} unit truk dan ${staff} personel untuk pembersihan.`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}