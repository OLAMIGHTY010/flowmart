import { apiClient } from "./api";

export const paymentService = {
  resolveBankAccount: async (accountNumber: string, bankCode: string): Promise<{ success: boolean; data: { accountName: string; accountNumber: string } }> => {
    return apiClient.get(`/payment/bank/resolve?accountNumber=${accountNumber}&bankCode=${bankCode}`);
  }
};
