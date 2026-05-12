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

  async predict(payload: Record<string, any>) {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}

export const wasteService = WastePredictionService.getInstance();