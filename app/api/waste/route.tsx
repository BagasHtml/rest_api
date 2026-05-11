import { NextResponse } from "next/server";
import { wasteService } from "../../lib/waste-api";
import { prisma } from "../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const locationName = body.locationName || "JIS";
    const visitorEstimate = Number(body.visitorEstimate) || 1000;

    const aiData = await wasteService.predict(locationName, visitorEstimate);
    const predictionResults = aiData.data?.prediction_results || [];

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

    if (enrichedResults.length > 0) {
      await prisma.predictionLog.create({
        data: {
          area: {
            connectOrCreate: {
              where: { name: locationName },
              create: {
                name: locationName,
                latitude: aiData.latitude || -6.124,
                longitude: aiData.longitude || 106.821,
              }
            }
          },
          prediction_date: new Date(),
          volume_ton: enrichedResults[0].total_volume_ton || 0,
          confidence_score: aiData.confidence_score || 0,
          risk_status: (enrichedResults[0].total_volume_ton || 0) > 10 ? "HIGH" : "NORMAL",
          created_at: new Date()
        }
      });
    }

    return NextResponse.json({
      status: aiData.status,
      message: aiData.message,
      confidence_score: aiData.confidence_score,
      data: {
        location: locationName,
        coordinates: {
          lat: aiData.latitude || -6.124,
          lng: aiData.longitude || 106.821,
        },
        prediction_results: enrichedResults,
        logistics_plan: aiData.data?.logistics_plan || {},
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 },
    );
  }
}