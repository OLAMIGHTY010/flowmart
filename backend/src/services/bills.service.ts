import axios from 'axios';

interface BillPaymentParams {
  category: 'airtime' | 'data' | 'electricity' | 'cable';
  customer: string; // phone or meter/smartcard number
  amount: number;
  billerCode?: string; // e.g. for electricity/cable specific providers
  itemCode?: string; // e.g. for specific data plans
  reference: string;
}

export class BillsService {
  private baseUrl = 'https://api.flutterwave.com/v3';
  
  private getHeaders() {
    return {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  // 1. Get Categories (Airtime/Data networks, Electricity discos, Cable providers)
  public async getBillCategories(type: 'airtime' | 'data' | 'power' | 'cable') {
    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
       // Mock response
       if (type === 'airtime' || type === 'data') {
         return [
           { biller_code: 'BIL099', name: 'MTN', short_name: 'MTN', item_code: 'AT099' },
           { biller_code: 'BIL100', name: 'GLO', short_name: 'GLO', item_code: 'AT100' },
           { biller_code: 'BIL102', name: 'Airtel', short_name: 'AIRTEL', item_code: 'AT102' },
           { biller_code: 'BIL103', name: '9Mobile', short_name: '9MOBILE', item_code: 'AT103' },
         ];
       }
       if (type === 'power') {
         return [
           { biller_code: 'BIL112', name: 'Ikeja Electric (IKEDC)', short_name: 'IKEDC', item_code: 'UB112' },
           { biller_code: 'BIL113', name: 'Eko Electric (EKEDC)', short_name: 'EKEDC', item_code: 'UB113' },
           { biller_code: 'BIL114', name: 'Abuja Electric (AEDC)', short_name: 'AEDC', item_code: 'UB114' },
           { biller_code: 'BIL115', name: 'Port Harcourt Electric (PHED)', short_name: 'PHED', item_code: 'UB115' },
         ];
       }
       return [];
    }

    try {
      let billerCodeQuery = '';
      if (type === 'airtime') billerCodeQuery = '?biller_code=AIRTIME';
      else if (type === 'data') billerCodeQuery = '?biller_code=DATA_BUNDLE';
      
      // In a real scenario you would filter standard billers
      const response = await axios.get(`${this.baseUrl}/bill-categories${billerCodeQuery}`, {
        headers: this.getHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Flutterwave get categories error:', error);
      throw new Error('Failed to fetch bill categories');
    }
  }

  // 2. Validate Customer (e.g. Meter Number)
  public async validateCustomer(itemCode: string, customer: string, billerCode: string) {
    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      return { status: 'success', data: { name: 'Verified Customer (Mock)', customer } };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/bill-items/${itemCode}/validate?customer=${customer}&code=${billerCode}`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Flutterwave validation error:', error);
      throw new Error('Failed to validate customer details');
    }
  }

  // 3. Create Payment
  public async payBill(params: BillPaymentParams) {
    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
       // Mock payment success
       return { 
         status: 'success', 
         message: 'Mock Bill Payment Successful', 
         data: { tx_ref: params.reference, amount: params.amount, network: params.billerCode } 
       };
    }

    try {
      const payload = {
        country: 'NG',
        customer: params.customer,
        amount: params.amount,
        type: params.billerCode || params.category.toUpperCase(), // Depends on FW's exact logic
        reference: params.reference
      };

      const response = await axios.post(`${this.baseUrl}/bills`, payload, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Flutterwave pay bill error:', error);
      throw new Error('Failed to process bill payment');
    }
  }
}

export const billsService = new BillsService();
