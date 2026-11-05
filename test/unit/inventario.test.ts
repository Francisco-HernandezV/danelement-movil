import {
  claveCelda,
  construirEntrada,
  erroresProductoLote,
  ordenarTallas,
  parseDinero,
  subtotalProductoLote,
  totalPiezas,
  type MatrizVariantes,
  type ProductoLote,
} from '@/data/models/inventario';

/** Matriz mínima: talla 1 con colores 1 y 2 (la talla 2 no tiene variantes). */
const matriz: MatrizVariantes = {
  producto: {
    id: 50,
    nombre: 'Blusa',
    precio_base: 300,
    costo_promedio_actual: 120,
    stock_total_actual: 10,
  },
  tallas: [
    { id: 1, valor: 'M', tipo: 'letra' },
    { id: 2, valor: 'L', tipo: 'letra' },
  ],
  colores: [
    { id: 1, nombre: 'Negro', codigo_hex: '#000000' },
    { id: 2, nombre: 'Blanco', codigo_hex: '#FFFFFF' },
  ],
  variantes: [
    { variante_id: 101, sku: 'BL-M-N', talla_id: 1, color_id: 1, stock: 5, costo_promedio: 120, precio: 300 },
    { variante_id: 102, sku: 'BL-M-B', talla_id: 1, color_id: 2, stock: 5, costo_promedio: 120, precio: 300 },
  ],
};

const lote = (celdas: Record<string, number>, costoTexto: string, precioTexto: string): ProductoLote => ({
  matriz,
  celdas,
  costoTexto,
  precioTexto,
});

describe('ordenarTallas', () => {
  it('ordena números como números, luego letras por talla y al final lo demás', () => {
    const tallas = ['M', '10', 'S', '8', 'XL', 'Unitalla'].map((valor) => ({ valor }));

    expect(ordenarTallas(tallas).map((t) => t.valor)).toEqual(['8', '10', 'S', 'M', 'XL', 'Unitalla']);
  });

  it('no modifica el arreglo original', () => {
    const tallas = [{ valor: 'L' }, { valor: 'S' }];
    ordenarTallas(tallas);

    expect(tallas.map((t) => t.valor)).toEqual(['L', 'S']);
  });
});

describe('totalPiezas', () => {
  it('suma solo cantidades positivas', () => {
    expect(totalPiezas({ a: 3, b: 0, c: -2, d: 4 })).toBe(7);
  });
});

describe('parseDinero', () => {
  it('acepta separador de miles', () => {
    expect(parseDinero('1,250.50')).toBe(1250.5);
  });

  it('devuelve null si está vacío o es inválido', () => {
    expect(parseDinero('')).toBeNull();
    expect(parseDinero('12a')).toBeNull();
  });
});

describe('erroresProductoLote', () => {
  it('lista todos los errores de un producto sin capturar', () => {
    expect(erroresProductoLote(lote({}, '', '0'))).toHaveLength(3);
  });

  it('un producto bien capturado no tiene errores', () => {
    expect(erroresProductoLote(lote({ [claveCelda(1, 1)]: 2 }, '120', '300'))).toEqual([]);
  });
});

describe('subtotalProductoLote', () => {
  it('multiplica piezas por costo unitario', () => {
    expect(subtotalProductoLote(lote({ '1-1': 3, '1-2': 2 }, '120.50', '300'))).toBe(602.5);
  });
});

describe('construirEntrada', () => {
  it('arma el payload solo con celdas con piezas y variante existente', () => {
    const payload = construirEntrada('  Proveedor X ', ' Factura 12 ', [
      lote({ '1-1': 3, '1-2': 0, '2-1': 5 }, '120', '299.90'),
    ]);

    expect(payload).toEqual({
      origen_mercancia: 'Proveedor X',
      nota_referencia: 'Factura 12',
      productos: [
        {
          producto_id: 50,
          costo_unitario: 120,
          nuevo_precio_venta: 299.9,
          variantes: [{ variante_id: 101, cantidad: 3 }],
        },
      ],
    });
  });
});
