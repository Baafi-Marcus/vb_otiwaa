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
                        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">{merchant?.name || 'Merchant'}</h1>
                        <p className="text-sm text-gray-500 mb-1">Receipt #{order.id.slice(-4)}</p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="space-y-6 mb-8">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                            <p className="font-bold text-lg">{order.customerName || 'Guest'}</p>
                            <p className="text-gray-600">{order.customerPhone}</p>
                        </div>

                        {(order.deliveryLocation || order.location) && (
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Delivery To</p>
                                <p className="font-medium text-gray-800 leading-snug">
                                    {order.deliveryLocation?.address || order.location || 'N/A'}
                                </p>
                            </div>
                        )}
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
                            Powered by VB.OTIWAA
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
