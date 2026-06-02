import { MockPaymentProvider } from './mock-payment.provider';

describe('MockPaymentProvider', () => {
  let provider: MockPaymentProvider;

  beforeEach(() => {
    provider = new MockPaymentProvider();
  });

  describe('createIntent', () => {
    it('should return pending status', async () => {
      const result = await provider.createIntent({ id: 'order-1', total: 100, currency: 'USD' });
      expect(result.provider).toBe('mock');
      expect(result.status).toBe('pending');
      expect(result.amount).toBe(100);
      expect(result.currency).toBe('USD');
      expect(result.providerPaymentId).toBeDefined();
      expect(result.rawResponse.mock).toBe(true);
    });
  });

  describe('confirm', () => {
    it('should return paid status', async () => {
      const result = await provider.confirm(
        { id: 'pay-1', provider: 'mock', providerPaymentId: 'mp-1', amount: 100 },
        {},
      );
      expect(result.status).toBe('paid');
      expect(result.rawResponse.approved).toBe(true);
    });
  });

  describe('refund', () => {
    it('should return refunded status', async () => {
      const result = await provider.refund(
        { id: 'pay-1', provider: 'mock', providerPaymentId: 'mp-1', amount: 100 },
        50,
      );
      expect(result.status).toBe('refunded');
    });
  });
});
