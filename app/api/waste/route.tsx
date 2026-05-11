import { NextResponse } from "next/server";
import { wasteService } from "../../lib/waste-api";
import { prisma } from "../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const locationName = body.locationName || "JIS";
    const visitorEstimate = Number(body.visitorEstimate) || 1000;
    const aiData = await wasteService.predict(locationName, visitorEstimate);
    const aiLocationName = aiData.data?.prediction_results?.[0]?.lokasi || locationName;

    const areaData = await prisma.masterArea.findFirst({
      where: { name: aiLocationName }
    });

    const predictionResults = aiData.data?.prediction_results || [];

    const totalVolume = predictionResults.reduce((acc: number, item: any) => {
      return acc + (item.total_volume_ton || 0);
    }, 0);

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
        ...item,
        calculated_staff: truckCount * 3,
        man_hours: truckCount * 3 * 8,
        weight_kg: vol * 1000,
      };
    });

    return NextResponse.json({
      status: aiData.status || "success",
      message: aiData.message,
      confidence_score: aiData.confidence_score,
      data: {
        location: aiLocationName,
        coordinates: {
          lat: aiData.latitude || -6.124,
          lng: aiData.longitude || 106.821,
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