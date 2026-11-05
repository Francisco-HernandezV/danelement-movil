import { resumirAbono, resumirAnticipo } from '@/features/apartados/viewmodels/apartadoCalculo';
import { resumirCobro, type PagoCaptura } from '@/features/ventas/viewmodels/cobroCalculo';

const pago = (id: number, metodo: PagoCaptura['metodo'], montoTexto: string): PagoCaptura => ({
  id,
  metodo,
  montoTexto,
  referencia: '',
});

describe('resumirAbono', () => {
  it('abono parcial deja saldo pendiente', () => {
    const r = resumirAbono(resumirCobro(50000, [pago(1, 'Efectivo', '200')]));

    expect(r.abonoCentavos).toBe(20000);
    expect(r.saldoRestanteCentavos).toBe(30000);
    expect(r.liquida).toBe(false);
    expect(r.valido).toBe(true);
  });

  it('abono con efectivo de más liquida y entrega cambio', () => {
    const r = resumirAbono(resumirCobro(50000, [pago(1, 'Efectivo', '600')]));

    expect(r.abonoCentavos).toBe(50000);
    expect(r.cambioCentavos).toBe(10000);
    expect(r.saldoRestanteCentavos).toBe(0);
    expect(r.liquida).toBe(true);
  });

  it('rechaza tarjeta por encima del saldo', () => {
    const r = resumirAbono(resumirCobro(50000, [pago(1, 'T. Crédito', '600')]));

    expect(r.error).toContain('saldo');
    expect(r.abonoCentavos).toBe(0);
    expect(r.valido).toBe(false);
  });

  it('no es válido con un monto inválido', () => {
    const r = resumirAbono(resumirCobro(50000, [pago(1, 'Efectivo', 'abc')]));

    expect(r.valido).toBe(false);
  });
});

describe('resumirAnticipo', () => {
  it('sin montos capturados no hay anticipo y es válido', () => {
    const r = resumirAnticipo(resumirCobro(100000, []), true);

    expect(r.abonoCentavos).toBe(0);
    expect(r.saldoRestanteCentavos).toBe(100000);
    expect(r.valido).toBe(true);
  });

  it('el mensaje de error se mide contra el total', () => {
    const r = resumirAnticipo(resumirCobro(100000, [pago(1, 'Transferencia', '1500')]), false);

    expect(r.error).toContain('total');
    expect(r.valido).toBe(false);
  });
});
