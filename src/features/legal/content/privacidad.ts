import { AVISO_VERSION, FECHA_VIGENCIA, type LegalDoc } from './types';

export const PRIVACIDAD: LegalDoc = {
  titulo: 'Aviso de privacidad integral',
  version: AVISO_VERSION,
  vigencia: FECHA_VIGENCIA,
  introduccion:
    'Este aviso se emite conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, publicada en el Diario Oficial de la Federación el 20 de marzo de 2025 (“la Ley”). Aplica al sitio web, a la aplicación móvil y a la tienda física de DanElement Boutique.',
  secciones: [
    {
      titulo: '1. Responsable',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'El **Lic. José Daniel Hernández Pérez**, quien opera el negocio con el nombre comercial **DanElement Boutique**, con domicilio en Calle Cuauhtémoc número 1, frente a la Presidencia Municipal, Huejutla de Reyes, Hidalgo, México, es el responsable del tratamiento de sus datos personales.',
        },
        {
          tipo: 'parrafo',
          texto:
            'Contacto para temas de privacidad: **danelementboutique@gmail.com** · Teléfono 56 4934 0578 · En tienda, de lunes a sábado de 9:00 a 19:00 y domingo de 10:00 a 17:00.',
        },
      ],
    },
    {
      titulo: '2. Datos personales que tratamos',
      bloques: [
        {
          tipo: 'tabla',
          columnas: ['Cuándo los obtenemos', 'Datos', 'Obligatorios u opcionales'],
          filas: [
            [
              'Al crear una cuenta en el sitio web o en la app',
              'Nombre completo, correo electrónico, contraseña y fecha de nacimiento. Teléfono.',
              'Obligatorios, salvo el teléfono',
            ],
            [
              'Al registrarle como cliente en la tienda',
              'Nombre. Si usted los proporciona: teléfono, correo electrónico, fecha de nacimiento, RFC (solo para solicitar un comprobante fiscal) y observaciones sobre su atención.',
              'Solo el nombre es obligatorio',
            ],
            [
              'Al comprar, apartar o cambiar mercancía',
              'Productos, importes, fechas, método de pago (efectivo, tarjeta o transferencia), referencia del pago, anticipos y abonos, y estado del apartado.',
              'Necesarios para la operación',
            ],
            ['Al solicitar un envío', 'Nombre, teléfono y lugar de entrega.', 'Necesarios para el envío'],
            [
              'Al usar su cuenta',
              'Fecha de registro, aceptación de estos documentos, verificación del correo, intentos de inicio de sesión y de recuperación de contraseña, y bloqueos de seguridad.',
              'Se generan automáticamente',
            ],
          ],
        },
        {
          tipo: 'parrafo',
          texto:
            '**No tratamos datos personales sensibles** (como origen étnico, salud, creencias o datos biométricos). No almacenamos números de tarjeta: los pagos con tarjeta se procesan en la terminal del banco. Su contraseña se guarda cifrada mediante una función de hash y nadie del personal puede conocerla.',
        },
        {
          tipo: 'parrafo',
          texto:
            'Algunos de estos datos son patrimoniales (importes, pagos y abonos). Los tratamos porque son necesarios para cumplir la compraventa o el apartado que usted solicita.',
        },
      ],
    },
    {
      titulo: '3. Finalidades',
      bloques: [
        { tipo: 'parrafo', texto: '**Finalidades primarias (necesarias para el servicio):**' },
        {
          tipo: 'lista',
          ordenada: true,
          items: [
            'Crear, verificar y administrar su cuenta, y permitirle iniciar sesión y recuperar su contraseña.',
            'Registrar sus compras, apartados, abonos y cambios de mercancía, y emitir los comprobantes correspondientes.',
            'Comunicarnos con usted sobre su cuenta, sus apartados y sus envíos.',
            'Coordinar los envíos que usted solicite.',
            'Atender las solicitudes de comprobante fiscal que usted haga en la tienda.',
            'Evaluar internamente, al momento de crear un apartado, la probabilidad de que este se cancele. Para ello se usa un modelo estadístico que considera su edad, su antigüedad como cliente y su historial de apartados. El resultado solo orienta al personal: **no se toma ninguna decisión de forma automática** y el apartado no se niega por este resultado.',
            'Proteger su cuenta y nuestros sistemas: detectar accesos indebidos, bloquear intentos repetidos y conservar registros de seguridad.',
            'Cumplir obligaciones legales y fiscales, y atender requerimientos de autoridades.',
          ],
        },
        { tipo: 'parrafo', texto: '**Finalidad secundaria (no necesaria para el servicio):**' },
        {
          tipo: 'lista',
          ordenada: true,
          items: [
            'Clasificar a los clientes en grupos según su frecuencia y monto de compra, para que el personal ofrezca una mejor atención en tienda.',
          ],
        },
        {
          tipo: 'parrafo',
          texto:
            'Las promociones de la tienda se publican en sus redes sociales; **no usamos sus datos para enviarle publicidad** por correo, mensajes ni llamadas.',
        },
        {
          tipo: 'parrafo',
          texto:
            'Si no desea que sus datos se usen para la finalidad secundaria, puede indicarlo en cualquier momento por los medios de la sección 6. Su negativa no será motivo para negarle productos ni servicios.',
        },
      ],
    },
    {
      titulo: '4. Con quién compartimos sus datos',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            '**Proveedores que tratan datos por nuestra cuenta (encargados).** Para operar los servicios usamos proveedores tecnológicos que alojan o procesan datos únicamente para ese fin:',
        },
        {
          tipo: 'tabla',
          columnas: ['Proveedor', 'Servicio', 'Datos a los que tiene acceso'],
          filas: [
            ['Render', 'Servidores y base de datos; servicio de análisis estadístico', 'Los datos del sistema'],
            ['Vercel', 'Publicación del sitio web', 'Datos técnicos de la conexión (dirección IP)'],
            ['Brevo', 'Envío de los correos de activación y recuperación de contraseña', 'Nombre y correo electrónico'],
            ['Cloudinary', 'Almacenamiento de imágenes de productos y del logotipo', 'Ninguno de clientes'],
          ],
        },
        {
          tipo: 'parrafo',
          texto: 'Algunos de estos proveedores pueden almacenar la información en servidores ubicados fuera de México.',
        },
        {
          tipo: 'parrafo',
          texto:
            '**Transferencias.** Solo compartimos sus datos con terceros en estos casos, que no requieren su consentimiento conforme al artículo 36 de la Ley:',
        },
        {
          tipo: 'tabla',
          columnas: ['Destinatario', 'Finalidad', '¿Requiere consentimiento?'],
          filas: [
            [
              'Mensajeros y operadores de transporte que llevan su envío',
              'Entregarle el paquete (nombre, teléfono y punto de entrega)',
              'No: es necesario para cumplir el envío que usted pidió',
            ],
            ['Autoridades competentes', 'Atender requerimientos legales o judiciales', 'No: lo exige la ley'],
          ],
        },
        { tipo: 'parrafo', texto: 'No vendemos ni rentamos sus datos personales.' },
      ],
    },
    {
      titulo: '5. Tecnologías que usan el sitio web y la app',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'El sitio web y la app **no usan cookies de rastreo, publicidad personalizada ni herramientas de analítica**.',
        },
        {
          tipo: 'lista',
          items: [
            '**Sitio web:** guarda en el almacenamiento local de su navegador (localStorage) la credencial de su sesión y su tipo de usuario, y guarda copias del catálogo para funcionar sin conexión. Esta información se borra al cerrar sesión o limpiar los datos del navegador. El sitio carga tipografías desde Google Fonts, por lo que Google recibe la dirección IP de su dispositivo.',
            '**App móvil:** guarda la credencial de su sesión en el almacenamiento cifrado del teléfono. No solicita acceso a su ubicación, cámara, contactos ni fotos, ni envía notificaciones.',
            '**Asistente de voz (Alexa):** consultar el catálogo por voz no requiere cuenta y no recaba datos personales. Las grabaciones de voz las procesa Amazon conforme a sus propios términos; nosotros no las recibimos ni las guardamos.',
          ],
        },
      ],
    },
    {
      titulo: '6. Derechos ARCO, revocación y limitación del uso',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'Usted puede **acceder** a sus datos, **rectificarlos**, **cancelarlos** u **oponerse** a su uso para fines específicos (derechos ARCO). También puede **revocar** su consentimiento y **limitar** el uso de sus datos.',
        },
        { tipo: 'parrafo', texto: '**Medios para presentar su solicitud:**' },
        {
          tipo: 'lista',
          items: [
            'Por correo electrónico a **danelementboutique@gmail.com**, con el asunto “Solicitud de derechos ARCO”.',
            'En la tienda, en Calle Cuauhtémoc número 1, Huejutla de Reyes, en el horario de atención.',
          ],
        },
        { tipo: 'parrafo', texto: '**Su solicitud debe incluir:**' },
        {
          tipo: 'lista',
          ordenada: true,
          items: [
            'Su nombre y un correo electrónico o domicilio para responderle.',
            'Una copia de su identificación oficial vigente. Si actúa un representante, también su identificación y el documento que acredite la representación. Si escribe desde el correo registrado en su cuenta, podemos pedirle confirmar su identidad por ese medio.',
            'El derecho que desea ejercer y una descripción clara de los datos (salvo que solicite acceso).',
            'Cualquier información que ayude a localizar sus datos, como el teléfono o correo con que está registrado.',
            'Si pide una rectificación, la corrección que solicita y, en su caso, el documento que la respalde.',
          ],
        },
        {
          tipo: 'parrafo',
          texto:
            '**Plazos:** le responderemos en un máximo de **20 días hábiles** desde que recibamos su solicitud. Si procede, la haremos efectiva dentro de los **15 días hábiles** siguientes a la respuesta. Ambos plazos pueden ampliarse una sola vez por un periodo igual, si las circunstancias lo justifican; le avisaremos si eso ocurre.',
        },
        {
          tipo: 'parrafo',
          texto:
            '**Respuesta:** por el mismo medio por el que nos escribió, o por el que nos indique. Los datos que solicite se le entregarán en archivo electrónico. El trámite es gratuito; solo podrían cobrarse costos de reproducción o envío.',
        },
        {
          tipo: 'parrafo',
          texto:
            '**Cuándo podemos negar la solicitud:** si no se acredita la identidad; si no tenemos sus datos; si se afectan derechos de terceros; si existe un impedimento legal o resolución de autoridad; o si el derecho ya se ejerció. Le explicaremos el motivo.',
        },
        {
          tipo: 'parrafo',
          texto:
            '**Cancelación y baja de cuenta:** cuando proceda, sus datos se bloquearán y después se suprimirán. Los registros de ventas y pagos que la ley obliga a conservar se mantendrán sin datos que le identifiquen, o bloqueados, durante el plazo legal.',
        },
        {
          tipo: 'parrafo',
          texto:
            'Si lo desea, le proporcionamos un formato de solicitud en la tienda o por correo. Si considera que su solicitud no fue atendida correctamente, puede acudir a la **Secretaría Anticorrupción y Buen Gobierno**, autoridad en materia de protección de datos personales.',
        },
      ],
    },
    {
      titulo: '7. Personas menores de edad',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'Para crear una cuenta en el sitio web o en la app se requiere ser mayor de 18 años. Si un menor de edad realiza una compra en tienda, sus datos solo se tratarán con el consentimiento de su madre, padre o tutor.',
        },
      ],
    },
    {
      titulo: '8. Cambios a este aviso',
      bloques: [
        {
          tipo: 'parrafo',
          texto:
            'Cualquier cambio se publicará en el sitio web, en la app y en la tienda, con su número de versión y fecha de entrada en vigor. Si el cambio agrega finalidades que requieran su consentimiento, se lo pediremos antes de aplicarlo.',
        },
      ],
    },
  ],
};
