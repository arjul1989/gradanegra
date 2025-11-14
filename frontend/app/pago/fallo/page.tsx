"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function PagoFalloContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const statusDetail = searchParams.get('status_detail');

  useEffect(() => {
    if (paymentId) {
      setPaymentInfo({
        paymentId,
        status,
        statusDetail
      });
    }
  }, [paymentId, status, statusDetail]);

  // Mapeo de mensajes según el status_detail
  const getErrorMessage = (detail: string | null) => {
    const messages: { [key: string]: string } = {
      'cc_rejected_bad_filled_card_number': 'Número de tarjeta inválido',
      'cc_rejected_bad_filled_date': 'Fecha de vencimiento inválida',
      'cc_rejected_bad_filled_other': 'Revisa los datos de tu tarjeta',
      'cc_rejected_bad_filled_security_code': 'Código de seguridad inválido',
      'cc_rejected_blacklist': 'No pudimos procesar tu pago',
      'cc_rejected_call_for_authorize': 'Debes autorizar el pago con tu banco',
      'cc_rejected_card_disabled': 'Tarjeta deshabilitada. Contacta a tu banco',
      'cc_rejected_card_error': 'No pudimos procesar tu tarjeta',
      'cc_rejected_duplicated_payment': 'Ya realizaste un pago similar',
      'cc_rejected_high_risk': 'Tu pago fue rechazado',
      'cc_rejected_insufficient_amount': 'Fondos insuficientes',
      'cc_rejected_invalid_installments': 'Número de cuotas no disponible',
      'cc_rejected_max_attempts': 'Alcanzaste el límite de intentos',
      'cc_rejected_other_reason': 'Tu banco rechazó el pago'
    };

    return messages[detail || ''] || 'El pago no pudo ser procesado';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 rounded-lg p-8 text-center">
        {/* Icono de Error */}
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-red-500 text-4xl">
            cancel
          </span>
        </div>

        {/* Título */}
        <h1 className="text-white text-2xl font-bold mb-4">
          Pago Rechazado
        </h1>

        {/* Mensaje */}
        <p className="text-white/70 mb-6">
          {paymentInfo?.statusDetail 
            ? getErrorMessage(paymentInfo.statusDetail)
            : "Tu pago no pudo ser procesado. Por favor, intenta con otro método de pago."}
        </p>

        {/* Información del Pago (si existe) */}
        {paymentInfo && (
          <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2">
              {paymentInfo.paymentId && (
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">ID de Pago:</span>
                  <span className="text-white text-sm font-mono">{paymentInfo.paymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Estado:</span>
                <span className="text-red-500 text-sm font-semibold">Rechazado</span>
              </div>
              {paymentInfo.statusDetail && (
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Detalle:</span>
                  <span className="text-white/80 text-xs">{paymentInfo.statusDetail}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Razones Comunes */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
          <h3 className="text-white font-semibold text-sm mb-2">Razones comunes:</h3>
          <ul className="text-white/60 text-xs space-y-1">
            <li>• Fondos insuficientes</li>
            <li>• Datos de tarjeta incorrectos</li>
            <li>• Tarjeta vencida o bloqueada</li>
            <li>• Límite de compras excedido</li>
          </ul>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Intentar Nuevamente
          </button>
          
          <Link
            href="/"
            className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>

        {/* Nota de Soporte */}
        <p className="text-white/50 text-xs mt-6">
          Si el problema persiste, contacta a tu banco o intenta con otro método de pago.
        </p>
      </div>
    </div>
  );
}

export default function PagoFalloPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <PagoFalloContent />
    </Suspense>
  );
}

