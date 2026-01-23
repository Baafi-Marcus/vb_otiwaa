import React, { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface ReceiptViewProps {
    order: any;
    merchant: any;
    onClose: () => void;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({ order, merchant, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Receipt-${order.id}`,
    });

    if (!order) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
            <div className="bg-white text-black w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Actions Toolbar */}
                <div className="bg-gray-100 p-4 flex justify-between items-center border-b no-print">
                    <h3 className="font-bold text-lg">Print Receipt</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePrint && handlePrint()}
                            className="p-2 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            <Printer className="w-5 h-5" />
                            Print
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Area */}
                <div className="overflow-y-auto p-8 custom-scrollbar bg-white" ref={componentRef}>
                    <style>
                        {`
                            @media print {
                                @page { margin: 0; size: auto; }
                                body { -webkit-print-color-adjust: exact; }
                                .no-print { display: none !important; }
                            }
                        `}
                    </style>

                    <div className="text-center mb-8 border-b pb-6 border-dashed border-gray-300">
                        {merchant?.logoUrl ? (
                            <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl p-2 border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden">
                                <img
                                    src={merchant.logoUrl.startsWith('http') ? merchant.logoUrl : `${window.location.protocol}//${window.location.host}${merchant.logoUrl}`}
                                    className="w-full h-full object-contain"
                                    alt={merchant.name}
                                />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400 font-black text-2xl mb-4">
                                {merchant?.name?.[0] || 'M'}
                            </div>
                        )}
                        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">{merchant?.name || 'Merchant'}</h1>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest space-y-1">
                            {merchant?.location && <p>📍 {merchant.location}</p>}
                            <div className="flex justify-center gap-4">
                                {merchant?.contactPhone && <p>📞 {merchant.contactPhone}</p>}
                                {merchant?.contactEmail && <p>✉️ {merchant.contactEmail}</p>}
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Receipt #</p>
                                <p className="font-black text-sm">{order.shortId || order.id.slice(-4)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Date</p>
                                <p className="font-bold text-xs">{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
                            <p className="font-black text-sm text-gray-900 leading-tight">{order.customerName || 'Valued Customer'}</p>
                            <p className="text-xs text-gray-500">{order.customerPhone}</p>
                            {order.fulfillmentMode === 'DELIVERY' && order.location && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-[9px] font-bold text-blue-500 uppercase mb-1">Delivery Address</p>
                                    <p className="text-[10px] text-gray-700 leading-tight italic">{order.location}</p>
                                </div>
                            )}
                        </div>

                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fulfillment</p>
                            <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter mb-2 ${order.fulfillmentMode === 'DELIVERY' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                {order.fulfillmentMode || 'Standard'}
                            </div>
                            {order.fulfillmentMode === 'PICKUP' && (
                                <div className="text-[10px] text-gray-500 leading-tight">
                                    <p className="font-bold">Self-Pickup</p>
                                    <p>{merchant?.location || 'At our store'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Order Items</p>
                        <ul className="space-y-3">
                            {/* Parse items if they are JSON string or array */}
                            {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []).map((item: any, idx: number) => (
                                <li key={idx} className="flex justify-between items-start text-sm">
                                    <div className="flex-1">
                                        <span className="font-bold text-gray-900">{item.quantity}x</span>{' '}
                                        <span className="text-gray-700">{item.name}</span>
                                    </div>
                                    <span className="font-mono font-medium text-gray-900 ml-4">
                                        {((parseFloat(item.price) || 0) * (item.quantity || 1)).toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-300 pt-6 space-y-2">
                        <div className="flex justify-between items-center text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-mono">
                                {((parseFloat(order.total?.replace(/[^0-9.]/g, '') || '0') - (parseFloat(order.deliveryFee) || 0))).toFixed(2)}
                            </span>
                        </div>
                        {parseFloat(order.deliveryFee) > 0 && (
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Delivery Fee</span>
                                <span className="font-mono">{parseFloat(order.deliveryFee).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-xl font-black mt-4 pt-4 border-t border-gray-100">
                            <span>Total</span>
                            <span>GHS {parseFloat(order.total?.replace(/[^0-9.]/g, '') || '0').toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-xs text-gray-400 mb-2">Thank you for your business!</p>
                        <div className="inline-block px-3 py-1 bg-black text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
                            Powered by FuseWeb Service
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
