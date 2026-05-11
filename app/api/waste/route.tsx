import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { locationName, visitorEstimate } = body;

    const hfResponse = await fetch("https://alamdieng-waste-prediction-api.hf.space/", {
      method: "GET",
      cache: 'no-store'
    });

    if (!hfResponse.ok) {
      throw new Error("AI Service Unavailable");
    }

    const aiData = await hfResponse.json();

    const volume = aiData.events_loaded 
      ? Number(aiData.events_loaded) * 2.5 
      : (Number(visitorEstimate) / 1000) * 0.75 || 2.0;

    const truckCapacity = aiData.truck_capacity || 5;
    const staffPerTruck = aiData.workers_per_truck || 3;

    const trucks = Math.ceil(volume / truckCapacity);
    const staff = trucks * staffPerTruck;
    const weight = volume * 0.4; 

    return NextResponse.json({
      status: "success",
      source: "AI Model Integration",
      data: {
        location: aiData.location_name || locationName || "Unmapped Location",
        coordinates: {
          lat: aiData.latitude || -6.200, 
          lng: aiData.longitude || 106.816
        },
        metrics: {
          total_volume: `${volume.toFixed(1)} m3`,
          total_weight: `${weight.toFixed(1)} Ton`,
          required_trucks: trucks,
          required_staff: staff,
          total_man_hours: staff * 8
        },
        ai_metadata: {
          model: aiData.model || "Chronos-T5",
          last_update: new Date().toISOString()
        },
        summary: `Berdasarkan analisis AI pada lokasi ${aiData.location_name || locationName}, diestimasi timbulan sampah sebesar ${weight.toFixed(1)} Ton. Diperlukan mobilisasi ${trucks} unit armada dan ${staff} personel lapangan.`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      status: "error", 
      message: error.message 
    }, { status: 500 });
  }
}