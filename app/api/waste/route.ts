export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { wasteService } from "../../lib/waste-api";
import { prisma } from "../../lib/prisma";

const DEFAULT_COORDINATES = { lat: -6.2088, lng: 106.8456 };

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    const aiData = await wasteService.predict(body);
    
    const aiLocationName = aiData.data?.prediction_results?.[0]?.lokasi || body.nama_lokasi || "Unknown";
    const normalizedLocation = aiLocationName.toLowerCase().trim();

    const areaData = await prisma.masterArea.findFirst({
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

    const predictionResults = aiData.data?.prediction_results || [];

    const totalVolume = predictionResults.reduce((acc: number, item: any) => acc + (item.total_volume_ton || 0), 0);
    const totalFoodWaste = predictionResults.reduce((acc: number, item: any) => acc + (item.sisa_makanan_organik_ton || 0), 0);
    const totalPlastic = predictionResults.reduce((acc: number, item: any) => acc + (item.plastik_ton || 0), 0);

    let dbLog = null;
    if (areaData) {
      dbLog = await prisma.predictionLog.create({
        data: {
          areaId: areaData.id,
          prediction_date: new Date(),
          volume_ton: totalVolume,
          confidence_score: aiData.confidence_score ? parseFloat(aiData.confidence_score.replace('%', '')) : 0,
          risk_status: totalVolume > 10 ? "HIGH" : totalVolume > 5 ? "MEDIUM" : "LOW",
        },
      });
    }

    const enrichedResults = predictionResults.map((item: any) => {
      const vol = item.total_volume_ton || 0;
      const aiLogistics = item.rekomendasi_logistik_dan_ops || {};
      const truckCount = aiLogistics.trucks_needed || Math.ceil(vol / 5);
      const staffCount = aiLogistics.manpower || (truckCount * 3);

      return {
        ds: item.ds,
        trend: item.trend,
        yhat: item.yhat,
        yhat_lower: item.yhat_lower,
        yhat_upper: item.yhat_upper,
        lokasi: item.lokasi,
        kategori_lokasi: item.kategori_lokasi,
        total_volume_ton: vol,
        sisa_makanan_organik_ton: item.sisa_makanan_organik_ton || 0,
        plastik_ton: item.plastik_ton || 0,
        weight_kg: vol * 1000,
        risk_score: item.risk_score || 0,
        risk_status: item.risk_status || "SAFE",
        logistics: {
          rekomendasi_truk: truckCount,
          calculated_staff: staffCount,
          estimated_duration_hours: aiLogistics.estimated_duration_hours || (truckCount * 8),
          man_hours: staffCount * (aiLogistics.estimated_duration_hours || 8)
        }
      };
    });

    const dynamicCoordinates = areaData?.latitude && areaData?.longitude 
      ? { lat: Number(areaData.latitude), lng: Number(areaData.longitude) }
      : DEFAULT_COORDINATES;

    return NextResponse.json({
      status: aiData.status || "success",
      message: aiData.message,
      confidence_score: aiData.confidence_score,
      generated_at: new Date().toISOString(),
      data: {
        location: aiLocationName,
        is_area_registered: !!areaData,
        coordinates: dynamicCoordinates,
        waste_summary: {
          total_volume_ton: totalVolume,
          total_food_waste_ton: totalFoodWaste,
          total_plastic_ton: totalPlastic,
          average_trend: predictionResults.length > 0 
            ? predictionResults.reduce((acc: number, curr: any) => acc + (curr.trend || 0), 0) / predictionResults.length 
            : 0
        },
        prediction_results: enrichedResults,
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