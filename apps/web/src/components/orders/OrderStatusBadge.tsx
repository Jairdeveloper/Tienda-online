const STATUS_STYLES: Record<string, string> = {
  created: "bg-gray-100 text-gray-800",
  stock_reserved: "bg-blue-100 text-blue-800",
  payment_pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  cod_pending: "bg-purple-100 text-purple-800",
  fulfilled: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  created: "Creado",
  stock_reserved: "Stock Reservado",
  payment_pending: "Pago Pendiente",
  paid: "Pagado",
  cod_pending: "Pendiente COD",
  fulfilled: "Completado",
  cancelled: "Cancelado",
};

interface Props {
  status: string;
}

export default function OrderStatusBadge({ status }: Props) {
  const colorClass = STATUS_STYLES[status] || "bg-gray-100 text-gray-800";
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}
