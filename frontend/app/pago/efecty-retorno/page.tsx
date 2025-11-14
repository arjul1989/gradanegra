"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function EfectyPaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<{
    status: string;
    statusDetail: string;
    paymentId: string;
  } | null>(null);

  useEffect(() => {
    const handlePaymentReturn = async () => {
      try {
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');
        const statusDetail = searchParams.get('status_detail');
        
        if (!paymentId) {
          console.warn('No payment_id found in URL');
          setPaymentStatus({
            status: 'unknown',
            statusDetail: 'Información de pago no encontrada',
            paymentId: 'N/A'
          });
          setLoading(false);
          return;
        }

        setPaymentStatus({
          status: status || 'pending',
          statusDetail: statusDetail || 'Pago en proceso',
          paymentId: paymentId
        });

        // Aquí se puede consultar el estado real del pago desde el backend
        // si se necesita información más actualizada
        
      } catch (error) {
        console.error('Error al procesar retorno de Efecty:', error);
        setPaymentStatus({
          status: 'error',
          statusDetail: 'Error al procesar la respuesta',
          paymentId: 'N/A'
        });
      } finally {
        setLoading(false);
      }
    };

    handlePaymentReturn();
  }, [searchParams]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'aprobado':
        return 'text-green-400';
      case 'rejected':
      case 'rechazado':
        return 'text-red-400';
      case 'pending':
      case 'pendiente':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
      case 'aprobado':
        return '¡Pago Efecty aprobado exitosamente!';
      case 'rejected':
      case 'rechazado':
        return 'Pago Efecty rechazado';
      case 'pending':
      case 'pendiente':
        return 'Pago Efecty en proceso de verificación';
      default:
        return 'Estado del pago Efecty';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Procesando retorno del pago Efecty...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 text-center">
          
          {/* Icono según estado */}
          <div className="mb-6">
            {paymentStatus?.status === 'approved' || paymentStatus?.status === 'aprobado' ? (
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : paymentStatus?.status === 'rejected' || paymentStatus?.status === 'rechazado' ? (
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>

          {/* Título */}
          <h1 className={`text-2xl font-bold mb-4 ${getStatusColor(paymentStatus?.status || '')}`}>
            {getStatusMessage(paymentStatus?.status || 'unknown')}
          </h1>

          {/* Detalles del pago */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-white font-semibold mb-3">Detalles del Pago</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Estado:</span>
                <span className={getStatusColor(paymentStatus?.status || '')}>
                  {paymentStatus?.statusDetail || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ID de Pago:</span>
                <span className="text-white font-mono">{paymentStatus?.paymentId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Método:</span>
                <span className="text-white">Efecty (Pago en efectivo)</span>
              </div>
            </div>
          </div>

          {/* Instrucciones según estado */}
          {paymentStatus?.status === 'pending' && (
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mb-6">
              <h3 className="text-blue-400 font-semibold mb-2">💡 Importante</h3>
              <p className="text-sm text-blue-200 mb-3">
                Los pagos en Efecty requieren que你先-realices el pago físico en un punto Efecty con el comprobante generado.
              </p>
              <p className="text-sm text-blue-200">
                La confirmación del pago puede tardar hasta 24 horas una vez realizado el pago físico.
              </p>
            </div>
          )}

          {paymentStatus?.status === 'approved' && (
            <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 mb-6">
              <h3 className="text-green-400 font-semibold mb-2">✅ Próximos pasos</h3>
              <p className="text-sm text-green-200">
                Tu compra ha sido procesada exitosamente. Recibirás tus tickets por email una vez que el pago sea confirmado.
              </p>
            </div>
          )}

          {paymentStatus?.status === 'rejected' && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <h3 className="text-red-400 font-semibold mb-2">❌ Problema con el pago</h3>
              <p className="text-sm text-red-200">
                El pago no pudo ser procesado. Verifica que el pago físico en Efecty se haya realizado correctamente.
              </p>
            </div>
          )}

          {/* Información adicional para pagos pendientes */}
          <div className="bg-amber-900/20 border border-amber-500/50 rounded-lg p-4 mb-6">
            <h3 className="text-amber-400 font-semibold mb-2">🏪 Cómo pagar en Efecty</h3>
            <ol className="text-sm text-amber-200 text-left space-y-1">
              <li>1. Dirígete a cualquier punto Efecty</li>
              <li>2. Presenta el código de referencia del comprobante</li>
              <li>3. Realiza el pago por el monto indicado</li>
              <li>4. Guarda el comprobante de pago</li>
            </ol>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Volver al inicio
            </Link>
            
            <Link
              href="/mis-compras"
              className="inline-flex items-center justify-center w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors border border-slate-600"
            >
              Ver mis compras
            </Link>
          </div>

          {/* Información adicional */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              ¿Necesitas ayuda? Contacta a nuestro soporte en support@gradanegra.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EfectyPaymentReturn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    }>
      <EfectyPaymentReturnContent />
    </Suspense>
  );
}