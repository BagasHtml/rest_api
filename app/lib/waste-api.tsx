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
    return response.json();
  }
}

export const wasteService = WastePredictionService.getInstance();