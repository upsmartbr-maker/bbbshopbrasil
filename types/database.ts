export type GatewayName = "mercadopago" | "pagseguro";

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface Settings {
  id: number;
  active_gateway: GatewayName;
  mp_access_token: string | null;
  mp_public_key: string | null;
  pagseguro_token: string | null;
  pagseguro_email: string | null;
  pagseguro_app_id?: string | null;
  pagseguro_app_key?: string | null;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  button_text: string | null;
  link: string | null;
  order_index: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  stock: number;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  order_index: number;
}

export interface ProductWithImages extends Product {
  product_images: ProductImage[];
}

export interface Testimonial {
  id: string;
  customer_name: string;
  customer_city: string | null;
  text: string;
  rating: number;
  photo_url: string | null;
  is_active: boolean;
  order_index: number;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  items: OrderItem[];
  total: number;
  gateway: GatewayName;
  status: OrderStatus;
  created_at: string;
}

