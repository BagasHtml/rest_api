export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { wasteService } from "../../lib/waste-api";
import { prisma } from "../../lib/prisma";

const COORDINATES_MAP: Record<string, { lat: number; lng: number }> = {
  "jis": { lat: -6.1214, lng: 106.8830 },
  "gbk": { lat: -6.2185, lng: 106.8018 },
  "ice bsd": { lat: -6.3006, lng: 106.6523 },
  "jakarta pusat": { lat: -6.1753, lng: 106.8271 },
  "jakarta selatan": { lat: -6.2615, lng: 106.8106 },
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    const aiData = await wasteService.predict(body);
    const aiLocationName = aiData.data?.prediction_results?.[0]?.lokasi || body.locationName;
    const normalizedLocation = typeof aiLocationName === 'string' ? aiLocationName.toLowerCase().trim() : "";

    const allAreas = await prisma.masterArea.findMany({
      select: { id: true, name: true }
    });

    const areaData = allAreas.find(area => 
      typeof area.name === 'string' && area.name.toLowerCase().trim() === normalizedLocation
    );

    const predictionResults = aiData.data?.prediction_results || [];

    const totalVolume = predictionResults.reduce((acc: number, item: any) => acc + (item.total_volume_ton || 0), 0);
    const totalFoodWaste = predictionResults.reduce((acc: number, item: any) => acc + (item.sisa_makanan_ton || 0), 0);
    const totalPlastic = predictionResults.reduce((acc: number, item: any) => acc + (item.plastik_ton || 0), 0);

    let dbLog = null;
    if (areaData) {
      dbLog = await prisma.predictionLog.create({
        data: {
          areaId: areaData.id,
          prediction_date: new Date(),
          volume_ton: totalVolume,
          confidence_score: aiData.confidence_score ? parseFloat(aiData.confidence_score) : 0,
          risk_status: totalVolume > 10 ? "HIGH" : totalVolume > 5 ? "MEDIUM" : "LOW",
        },
      });
    }

    const enrichedResults = predictionResults.map((item: any) => {
      const vol = item.total_volume_ton || 0;
      const truckCount = item.rekomendasi_truk || Math.ceil(vol / 5);
      
      return {
        ds: item.ds,
        trend: item.trend,
        yhat: item.yhat,
        yhat_lower: item.yhat_lower,
        yhat_upper: item.yhat_upper,
        lokasi: item.lokasi,
        kategori: item.kategori,
        total_volume_ton: vol,
        sisa_makanan_ton: item.sisa_makanan_ton || 0,
        plastik_ton: item.plastik_ton || 0,
        calculated_staff: truckCount * 3,
        man_hours: truckCount * 3 * 8,
        weight_kg: vol * 1000,
        rekomendasi_truk: truckCount,
      };
    });

    const dynamicCoordinates = COORDINATES_MAP[normalizedLocation] || { lat: -6.2088, lng: 106.8456 };

    return NextResponse.json({
      status: aiData.status || "success",
      message: aiData.message,
      confidence_score: aiData.confidence_score,
      generated_at: new Date().toISOString(),
      data: {
        location: aiLocationName,
        is_area_registered: !!areaData,
        coordinates: {
          lat: dynamicCoordinates.lat,
          lng: dynamicCoordinates.lng,
        },
        waste_summary: {
          total_volume_ton: totalVolume,
          total_food_waste_ton: totalFoodWaste,
          total_plastic_ton: totalPlastic,
          average_trend: predictionResults.length > 0 
            ? predictionResults.reduce((acc: any, curr: any) => acc + (curr.trend || 0), 0) / predictionResults.length 
            : 0
        },
        prediction_results: enrichedResults,
        logistics_plan: aiData.data?.logistics_plan || {},
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