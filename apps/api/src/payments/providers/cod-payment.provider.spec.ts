import { CodPaymentProvider } from './cod-payment.provider';

describe('CodPaymentProvider', () => {
  let provider: CodPaymentProvider;

  beforeEach(() => {
    provider = new CodPaymentProvider();
  });

  describe('createIntent', () => {
    it('should return cod_pending status', async () => {
      const result = await provider.createIntent({ id: 'order-1', total: 100, currency: 'USD' });
      expect(result.provider).toBe('cod');
      expect(result.status).toBe('cod_pending');
      expect(result.amount).toBe(100);
      expect(result.currency).toBe('USD');
      expect(result.providerPaymentId).toBeDefined();
      expect(result.rawResponse.method).toBe('cod');
    });
  });

  describe('confirm', () => {
    it('should return cod_pending status', async () => {
      const result = await provider.confirm(
        { id: 'pay-1', provider: 'cod', providerPaymentId: 'cp-1', amount: 100 },
        {},
      );
      expect(result.status).toBe('cod_pending');
    });
  });

  describe('refund', () => {
    it('should return refunded status', async () => {
      const result = await provider.refund(
        { id: 'pay-1', provider: 'cod', providerPaymentId: 'cp-1', amount: 100 },
      );
      expect(result.status).toBe('refunded');
    });
  });
});
