import { FECHA_VIGENCIA, TERMINOS_VERSION, type LegalDoc } from './types';

export const TERMINOS: LegalDoc = {
  titulo: 'Términos y condiciones de uso',
  version: TERMINOS_VERSION,
  vigencia: FECHA_VIGENCIA,
  introduccion: 'Sitio web y aplicación móvil de DanElement Boutique.',
  secciones: [
    {
      titulo: '1. Quién ofrece la plataforma',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            '**DanElement Boutique** es una tienda de ropa juvenil y accesorios, propiedad del **Lic. José Daniel Hernández Pérez**, ubicada en Calle Cuauhtémoc número 1, frente a la Presidencia Municipal, Huejutla de Reyes, Hidalgo, México.',
        },
        {
          tipo: 'tabla',
          columnas: ['Medio', 'Dato'],
          filas: [
            ['Teléfono y WhatsApp', '56 4934 0578'],
            ['Correo electrónico', 'danelementboutique@gmail.com'],
            ['Horario de la tienda', 'Lunes a sábado de 9:00 a 19:00; domingo de 10:00 a 17:00'],
            ['Redes sociales', 'Instagram @danelement_boutique_huejutla y Facebook'],
          ],
        },
      ],
    },
    {
      titulo: '2. Alcance y aceptación',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'Estos términos regulan el uso de dos servicios digitales de DanElement Boutique (en conjunto, “la plataforma”):',
        },
        {
          tipo: 'lista',
          items: ['El sitio web de DanElement Boutique.', 'La aplicación móvil DanElement para Android.'],
        },
        {
          tipo: 'parrafo',
          texto:
            'También regulan las compras, apartados, cambios y envíos que se registran en la plataforma, aunque se realicen en la tienda o por teléfono.',
        },
        {
          tipo: 'parrafo',
          texto:
            'Puede consultar el catálogo sin registrarse. Al crear una cuenta, usted declara que leyó y acepta estos términos. Si no está de acuerdo, no cree una cuenta ni use la plataforma.',
        },
        {
          tipo: 'parrafo',
          texto: 'El uso de sus datos personales se rige por el **Aviso de privacidad**.',
        },
      ],
    },
    {
      titulo: '3. Qué puede hacer en la plataforma',
      bloques: [
        {
          tipo: 'tabla',
          columnas: ['Función', 'Sitio web', 'App móvil'],
          filas: [
            ['Consultar el catálogo (fotos, precios, tallas, colores y existencias)', 'Sí, sin cuenta', 'Sí, sin cuenta'],
            ['Buscar y filtrar productos', 'Sí', 'Sí'],
            ['Crear cuenta, activarla por correo y recuperar la contraseña', 'Sí', 'Sí'],
            ['Consultar sus datos de cuenta', 'Sí', 'Sí'],
            ['Corregir nombre, correo y teléfono', 'Sí', 'No, por ahora'],
            ['Ver datos de contacto y ubicación de la tienda', 'Sí', 'Sí'],
            ['Comprar, pagar o apartar en línea', 'No', 'No'],
          ],
        },
        {
          tipo: 'nota',
          texto:
            '**La plataforma no vende en línea.** Las compras y los apartados se hacen en la tienda física o se coordinan por teléfono o WhatsApp. Si ve un botón de carrito o de apartado, este todavía no está disponible.',
        },
        {
          tipo: 'parrafo',
          texto:
            'Los precios, fotografías y existencias del catálogo son **informativos**. Pueden cambiar sin previo aviso y el inventario puede agotarse en tienda antes de actualizarse. El precio que se cobra es el vigente en la tienda al momento de la compra. Los colores pueden verse distintos según la pantalla. Los precios están en pesos mexicanos.',
        },
      ],
    },
    {
      titulo: '4. Cuentas de clientes',
      bloques: [
        {
          tipo: 'lista',
          ordenada: true,
          items: [
            'Para crear una cuenta debe ser mayor de 18 años y dar datos verdaderos: nombre, correo electrónico, contraseña y fecha de nacimiento. El teléfono es opcional.',
            'La cuenta se activa al confirmar su correo electrónico con el enlace que le enviamos.',
            'Su contraseña es personal. Debe tener entre 8 y 16 caracteres, con al menos una mayúscula, una minúscula, un número y un símbolo. Por seguridad, la cuenta se bloquea temporalmente tras varios intentos fallidos de inicio de sesión, y la recuperación de contraseña se bloquea 15 minutos tras 5 códigos incorrectos.',
            'Si usted ya es cliente de la tienda y se registra con el mismo correo que dio en tienda, su cuenta puede quedar ligada a su historial de compras y apartados.',
            'Puede corregir su nombre, correo y teléfono desde su perfil en el sitio web, y solicitar la baja de su cuenta en cualquier momento por los medios del Aviso de privacidad.',
            'Podemos suspender o cancelar una cuenta que se use para suplantar a otra persona, intentar acceder sin autorización o afectar el funcionamiento de la plataforma.',
          ],
        },
      ],
    },
    {
      titulo: '5. Cuentas del personal de la tienda',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'El sitio web y la app móvil incluyen módulos de uso interno: punto de venta, apartados y abonos, inventario, reportes, corte de caja y administración. Solo pueden usarlos las personas que trabajan en la tienda, con una cuenta creada por el administrador.',
        },
        {
          tipo: 'lista',
          ordenada: true,
          items: [
            'Cada cuenta del personal y su PIN son personales e intransferibles.',
            'El acceso a cada módulo depende del puesto (administrador, vendedor o gestor de inventario).',
            'La información de clientes, ventas e inventario solo puede usarse para el trabajo en la tienda. No puede copiarse, compartirse ni usarse para fines personales.',
            'Todas las operaciones quedan registradas con el nombre de quien las hizo.',
            'La cuenta se desactiva al terminar la relación laboral.',
          ],
        },
      ],
    },
    {
      titulo: '6. Usos prohibidos',
      bloques: [
        { tipo: 'parrafo', texto: 'No está permitido:' },
        {
          tipo: 'lista',
          items: [
            'Intentar acceder a módulos, cuentas o datos que no le corresponden.',
            'Registrar una cuenta con el correo o teléfono de otra persona.',
            'Usar programas automatizados para extraer información o saturar la plataforma.',
            'Intentar vulnerar la seguridad de la plataforma o alterar su funcionamiento.',
            'Copiar el catálogo, las fotografías o la marca con fines comerciales.',
          ],
        },
      ],
    },
    {
      titulo: '7. Compras en tienda y formas de pago',
      bloques: [
        {
          tipo: 'lista',
          ordenada: true,
          items: [
            'Se aceptan pagos en efectivo, con tarjeta, por transferencia o con una combinación de ellos.',
            'Cada venta se registra en la plataforma y se le entrega un comprobante (ticket), que puede recibir impreso o en PDF.',
            'Conserve su comprobante: lo necesitará para cambios y garantías.',
            'La plataforma no emite facturas. Si necesita factura de una compra, consúltelo directamente en la tienda.',
          ],
        },
      ],
    },
    {
      titulo: '8. Apartados',
      bloques: [
        {
          tipo: 'lista',
          ordenada: true,
          items: [
            'Puede apartar productos en la tienda dejando un **anticipo de entre el 30 % y el 50 %** del total. El porcentaje depende del monto de la compra y se le informa al apartar.',
            'El plazo para liquidar se indica en su comprobante de apartado.',
            'Puede abonar en efectivo, con tarjeta o por transferencia. Cada abono se registra y se refleja en su saldo.',
            'Mientras el apartado esté vigente, la mercancía queda reservada a su nombre. Se le entrega cuando liquida el total.',
            'Si el plazo vence sin que liquide, la tienda puede cancelar el apartado y regresar la mercancía a la venta.',
            '**Si el apartado vence sin liquidarse o usted lo cancela, el anticipo y los abonos realizados no se devuelven ni se convierten en saldo a favor.** Esta condición se le informa antes de apartar.',
          ],
        },
      ],
    },
    {
      titulo: '9. Cambios de mercancía',
      bloques: [
        {
          tipo: 'lista',
          ordenada: true,
          items: [
            'Puede cambiar un producto dentro de los **7 días naturales** siguientes a la compra, presentando su comprobante.',
            'El producto debe estar en buen estado, sin uso y con su etiqueta, si la traía.',
            'Puede cambiarlo por uno o varios productos cuyo precio sume **igual o más** de lo que pagó. Si el nuevo total es mayor, usted paga la diferencia.',
            '**No se devuelve dinero por cambio de opinión, talla, color o gusto.**',
          ],
        },
      ],
    },
    {
      titulo: '10. Garantía por defectos',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'La sección anterior no limita sus derechos como consumidor. Si un producto tiene un defecto de fabricación o no corresponde a lo ofrecido, usted puede elegir entre la reposición del producto, una bonificación o la devolución de lo pagado, conforme al artículo 92 de la Ley Federal de Protección al Consumidor. Repórtelo en la tienda o por teléfono con su comprobante.',
        },
      ],
    },
    {
      titulo: '11. Entregas y envíos',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'Los envíos no se solicitan en la plataforma. Se acuerdan por teléfono o WhatsApp al 56 4934 0578. Hay tres formas de recibir su compra:',
        },
        {
          tipo: 'tabla',
          columnas: ['Forma', 'Cómo funciona'],
          filas: [
            ['Recoger en tienda', 'Sin costo, en el horario de atención.'],
            ['Envío local', 'Dentro de Huejutla y alrededores, con un mensajero en motocicleta.'],
            [
              'Envío foráneo',
              'A localidades como Platón, San Felipe, Atlapexco o Huautla. La tienda lleva el paquete a la base de transporte de Huejutla que va a su localidad y lo entrega al operador que sale hacia allá. Usted lo recoge en el punto acordado.',
            ],
          ],
        },
        {
          tipo: 'lista',
          ordenada: true,
          items: [
            'Antes de enviar se le informa el costo, el medio de transporte y el punto y el momento aproximados de entrega. El envío se hace solo cuando usted acepta.',
            'Usted debe dar datos de contacto y entrega correctos y recoger el paquete a tiempo.',
            'Revise el paquete al recibirlo. Si hay un defecto, aplica la sección 10.',
            'Si el paquete se pierde o se daña durante el traslado, DanElement Boutique responde por él y acordará con usted la solución: reposición del producto o devolución de lo pagado. Repórtelo por teléfono o WhatsApp en cuanto lo detecte.',
          ],
        },
      ],
    },
    {
      titulo: '12. Promociones',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'Las promociones se anuncian en las redes sociales oficiales de la tienda. Cada promoción aplica con las condiciones y la vigencia indicadas en su publicación. La plataforma no envía promociones por correo ni notificaciones.',
        },
      ],
    },
    {
      titulo: '13. Propiedad intelectual',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'La marca DanElement Boutique, su logotipo, las fotografías de productos y el diseño de la plataforma pertenecen a su titular o se usan con autorización. No pueden reproducirse con fines comerciales sin permiso por escrito.',
        },
      ],
    },
    {
      titulo: '14. Disponibilidad y responsabilidad',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'Procuramos que la plataforma funcione de forma continua, pero puede interrumpirse por mantenimiento, fallas de conexión o fallas de los proveedores de alojamiento. Esas interrupciones no afectan las compras ni los apartados ya registrados.',
        },
        {
          tipo: 'parrafo',
          texto:
            'No somos responsables de daños causados por el uso indebido de su cuenta cuando usted compartió su contraseña o no la protegió.',
        },
      ],
    },
    {
      titulo: '15. Cambios a estos términos',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'Cualquier cambio se publicará en el sitio web y en la app con su número de versión y fecha. Los cambios no afectan compras, apartados ni cambios de mercancía ya realizados. Si un cambio es importante, le pediremos aceptarlo la siguiente vez que inicie sesión.',
        },
      ],
    },
    {
      titulo: '16. Quejas y legislación aplicable',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'Si tiene una queja o duda, contáctenos primero por los medios de la sección 1. También puede acudir a la Procuraduría Federal del Consumidor (Profeco).',
        },
        {
          tipo: 'parrafo',
          texto:
            'Estos términos se rigen por las leyes de los Estados Unidos Mexicanos, en particular la Ley Federal de Protección al Consumidor. Para cualquier controversia, las partes se someten a los tribunales competentes de Huejutla de Reyes, Hidalgo, sin perjuicio de la competencia de la Profeco.',
        },
      ],
    },
  ],
};
