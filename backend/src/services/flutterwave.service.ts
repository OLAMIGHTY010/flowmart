import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';

export class FlutterwaveService {
  static async initiateTransfer(amount: number, bankCode: string, accountNumber: string, reference: string, narration: string) {
    if (!FLUTTERWAVE_SECRET_KEY) {
      console.warn("FLUTTERWAVE_SECRET_KEY is missing. Simulating transfer instead of hitting API.");
      // If we're missing keys, mock it so development isn't entirely broken
      return { status: "success", message: "Simulated transfer", data: { reference } };
    }

    try {
      const response = await axios.post(
        'https://api.flutterwave.com/v3/transfers',
        {
          account_bank: bankCode,
          account_number: accountNumber,
          amount: amount,
          narration: narration,
          currency: "NGN",
          reference: reference,
          callback_url: "https://yourdomain.com/api/v1/finance/flutterwave-webhook" // Future-proofing
        },
        {
          headers: {
            Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Flutterwave Transfer Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Flutterwave transfer failed');
    }
  }
}
