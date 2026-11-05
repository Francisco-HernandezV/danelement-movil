import {
  aplicarCambio,
  centavosATexto,
  parseCentavos,
  pagosParaEnviar,
  pendienteParaPago,
  resumirCobro,
  sugerenciasEfectivo,
  type PagoCaptura,
} from '@/features/ventas/viewmodels/cobroCalculo';

/** Atajo para crear pagos de prueba. */
const pago = (
  id: number,
  metodo: PagoCaptura['metodo'],
  montoTexto: string,
  referencia = '',
): PagoCaptura => ({ id, metodo, montoTexto, referencia });

describe('parseCentavos', () => {
  it('convierte texto con separador de miles a centavos', () => {
    expect(parseCentavos('1,500.50')).toBe(150050);
  });

  it('devuelve null para texto vacío o no numérico', () => {
    expect(parseCentavos('')).toBeNull();
    expect(parseCentavos('   ')).toBeNull();
    expect(parseCentavos('.')).toBeNull();
    expect(parseCentavos('abc')).toBeNull();
    expect(parseCentavos('-10')).toBeNull();
  });
});

describe('centavosATexto', () => {
  it('formatea con dos decimales', () => {
    expect(centavosATexto(12350)).toBe('123.50');
  });

  it('devuelve vacío para cero', () => {
    expect(centavosATexto(0)).toBe('');
  });
});

describe('resumirCobro', () => {
  it('da cambio cuando el efectivo excede el total', () => {
    const r = resumirCobro(10000, [pago(1, 'Efectivo', '150')]);

    expect(r.pagadoCentavos).toBe(15000);
    expect(r.cambioCentavos).toBe(5000);
    expect(r.restanteCentavos).toBe(0);
    expect(r.error).toBeNull();
    expect(r.completo).toBe(true);
  });

  it('no permite que tarjetas superen el total (solo el efectivo da cambio)', () => {
    const r = resumirCobro(10000, [pago(1, 'T. Débito', '120')]);

    expect(r.error).not.toBeNull();
    expect(r.cambioCentavos).toBe(0);
    expect(r.completo).toBe(false);
  });

  it('combina tarjeta + efectivo y calcula el cambio solo del efectivo', () => {
    const r = resumirCobro(10000, [pago(1, 'T. Débito', '60'), pago(2, 'Efectivo', '50')]);

    expect(r.noEfectivoCentavos).toBe(6000);
    expect(r.efectivoCentavos).toBe(5000);
    expect(r.cambioCentavos).toBe(1000);
    expect(r.completo).toBe(true);
  });

  it('marca restante cuando el pago es parcial', () => {
    const r = resumirCobro(10000, [pago(1, 'Efectivo', '40')]);

    expect(r.restanteCentavos).toBe(6000);
    expect(r.completo).toBe(false);
  });

  it('reporta error por pago inválido, pero no por campo vacío', () => {
    const r = resumirCobro(10000, [
      pago(1, 'Efectivo', 'abc'),
      pago(2, 'Efectivo', '0'),
      pago(3, 'Efectivo', ''),
    ]);

    expect(r.erroresPago[1]).toBe('Monto inválido.');
    expect(r.erroresPago[2]).toBe('El monto debe ser mayor a cero.');
    expect(r.erroresPago[3]).toBeUndefined();
    expect(r.completo).toBe(false);
  });

  it('sin pagos no está completo', () => {
    expect(resumirCobro(10000, []).completo).toBe(false);
  });
});

describe('aplicarCambio y pagosParaEnviar', () => {
  const pagos = [pago(1, 'T. Débito', '60', '1234'), pago(2, 'Efectivo', '50', 'ignorar')];
  const resumen = resumirCobro(10000, pagos);

  it('descuenta el cambio del efectivo y no de la tarjeta', () => {
    const aplicados = aplicarCambio(pagos, resumen);

    expect(aplicados.map((a) => a.centavos)).toEqual([6000, 4000]);
  });

  it('arma el payload en pesos, con referencia solo en métodos no efectivo', () => {
    expect(pagosParaEnviar(pagos, resumen)).toEqual([
      { metodo: 'T. Débito', monto: 60, referencia: '1234' },
      { metodo: 'Efectivo', monto: 40 },
    ]);
  });

  it('omite pagos en efectivo que quedan en cero', () => {
    const conCero = [pago(1, 'Efectivo', '100'), pago(2, 'Efectivo', '20')];
    const r = resumirCobro(10000, conCero);

    expect(pagosParaEnviar(conCero, r)).toEqual([{ metodo: 'Efectivo', monto: 100 }]);
  });
});

describe('pendienteParaPago', () => {
  it('resta los demás pagos válidos del total', () => {
    const pagos = [pago(1, 'Efectivo', '30'), pago(2, 'Efectivo', '20')];

    expect(pendienteParaPago(10000, pagos, 2)).toBe(7000);
  });
});

describe('sugerenciasEfectivo', () => {
  it('sugiere hasta 3 billetes redondos por encima de lo pendiente', () => {
    expect(sugerenciasEfectivo(23750)).toEqual([25000, 30000, 40000]);
  });

  it('no incluye el monto exacto', () => {
    expect(sugerenciasEfectivo(10000)).toEqual([20000, 50000, 100000]);
  });

  it('sin pendiente no sugiere nada', () => {
    expect(sugerenciasEfectivo(0)).toEqual([]);
  });
});
