export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { wasteService } from "../../lib/waste-api";
import { prisma } from "../../lib/prisma";

const DEFAULT_COORDINATES = { lat: -6.2088, lng: 106.8456 };

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    if (!body.nama_lokasi) {
      return NextResponse.json(
        { status: "error", message: "Properti 'nama_lokasi' wajib diisi." },
        { status: 400 }
      );
    }

    const aiData = await wasteService.predict(body);
    
    const aiLocationName = aiData.data?.prediction_results?.[0]?.lokasi || body.nama_lokasi || "Unknown";
    const normalizedLocation = aiLocationName.toLowerCase().trim();

    let areaData = await prisma.masterArea.findFirst({
      where: {
        name: {
          equals: normalizedLocation
        }
      },
      select: { 
        id: true, 
        latitude: true, 
        longitude: true 
      }
    });

    if (!areaData) {
      areaData = await prisma.masterArea.create({
        data: {
          name: aiLocationName,
          latitude: DEFAULT_COORDINATES.lat,
          longitude: DEFAULT_COORDINATES.lng
        },
        select: {
          id: true,
          latitude: true,
          longitude: true
        }
      });
    }

    const predictionResults = aiData.data?.prediction_results || [];

    const totalVolume = predictionResults.reduce((acc: number, item: any) => acc + (item.total_volume_ton || 0), 0);
    const totalFoodWaste = predictionResults.reduce((acc: number, item: any) => acc + (item.sisa_makanan_ton || 0), 0);
    const totalPlastic = predictionResults.reduce((acc: number, item: any) => acc + (item.plastik_ton || 0), 0);

    const logisticsPlan = aiData.data?.logistics_plan || {};

    // Proses insert disesuaikan murni dengan model PredictionLog di schema.prisma kamu
    const dbLog = await prisma.predictionLog.create({
      data: {
        areaId: areaData.id,
        prediction_date: new Date(),
        volume_ton: totalVolume,
        confidence_score: aiData.confidence_score ? parseFloat(aiData.confidence_score.toString().replace('%', '')) : 0,
        risk_status: totalVolume > 10 ? "HIGH" : totalVolume > 5 ? "MEDIUM" : "LOW"
      },
    });

    const enrichedResults = predictionResults.map((item: any) => {
      const vol = item.total_volume_ton || 0;
      
      return {
        tanggal: item.tanggal,
        lokasi: item.lokasi,
        total_volume_ton: vol,
        sisa_makanan_ton: item.sisa_makanan_ton || 0,
        plastik_ton: item.plastik_ton || 0,
        rekomendasi_truk: item.rekomendasi_truk || Math.ceil(vol / 5),
        status_risiko: item.status_risiko || item.risk_status || "SAFE ✅",
        info_event: item.info_event || "Tidak ada Event yang berlangsung."
      };
    });

    const dynamicCoordinates = {
      lat: Number(areaData.latitude),
      lng: Number(areaData.longitude)
    };

    return NextResponse.json({
      status: aiData.status || "success",
      message: aiData.message,
      confidence_score: aiData.confidence_score ? parseFloat(aiData.confidence_score.toString()) : 0,
      generated_at: new Date().toISOString(),
      data: {
        location: aiLocationName,
        is_area_registered: true,
        coordinates: dynamicCoordinates,
        waste_summary: {
          total_volume_ton: totalVolume,
          total_food_waste_ton: totalFoodWaste,
          total_plastic_ton: totalPlastic,
        },
        prediction_results: enrichedResults,
        logistics_plan: logisticsPlan,
        database_log: dbLog, 
      },
    });
  } catch (error: any) {
    console.error("API Error:", error.message);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 },
    );
  }
}