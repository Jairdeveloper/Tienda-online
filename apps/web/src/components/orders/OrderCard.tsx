import { Link } from "react-router-dom";
import type { Order } from "../../types/orders";
import OrderStatusBadge from "./OrderStatusBadge";

interface Props {
  order: Order;
}

export default function OrderCard({ order }: Props) {
  const shortId = order.id.substring(0, 8);
  const date = new Date(order.createdAt).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <Link
      to={`/orders/${order.id}`}
      className="block bg-white shadow-md rounded-xl p-5 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm text-gray-500">N° </span>
          <span className="font-mono text-sm font-medium text-gray-900">
            {shortId}
          </span>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{date}</p>
          <p className="text-sm text-gray-500">
            {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
          </p>
        </div>
        <p className="text-lg font-bold text-gray-900">
          ${order.total.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
