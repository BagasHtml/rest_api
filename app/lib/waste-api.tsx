import { prisma } from "./prisma";

class WastePredictionService {
  private static instance: WastePredictionService;
  private readonly apiUrl: string;

  private constructor() {
    this.apiUrl = process.env.API_URL || "";
  }

  public static getInstance(): WastePredictionService {
    if (!WastePredictionService.instance) {
      WastePredictionService.instance = new WastePredictionService();
    }
    return WastePredictionService.instance;
  }

  async predict(location: string, visitorCount: number) {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: location,
        visitor_count: visitorCount,
      }),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`AI API Error: ${response.statusText}`);
    
    const aiData = await response.json();
    const area = await prisma.masterArea.findUnique({
      where: { name: location }
    });

    if (area) {
      await prisma.predictionLog.create({
        data: {
          areaId: area.id,
          prediction_date: new Date(),
          volume_ton: aiData.data?.prediction_results[0]?.total_volume_ton || 0,
          confidence_score: aiData.confidence_score || 0,
          risk_status: aiData.status || "NORMAL",
        },
      });
    }

    return aiData;
  }
}

export const wasteService = WastePredictionService.getInstance();