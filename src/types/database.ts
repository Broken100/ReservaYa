// ─── Enums ────────────────────────────────────────────────
export type UserRole = 'admin' | 'client';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentMethod = 'cash' | 'transfer';
export type OrderStatus = 'pending' | 'completed' | 'cancelled';

// ─── Row types ────────────────────────────────────────────
export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  settings: {
    enable_products?: boolean;
    theme_color?: string;
    show_socials?: boolean;
    show_services?: boolean;
    show_products?: boolean;
    social_links?: {
      whatsapp?: string;
      instagram?: string;
      facebook?: string;
      website?: string;
    };
    [key: string]: any;
  } | null;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  stock: number;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  currency: string;
  image_url: string | null;
  is_active: boolean;
}

export interface Professional {
  id: string;
  business_id: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface BusinessHours {
  id: string;
  business_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  open_time: string;   // HH:MM:SS
  close_time: string;  // HH:MM:SS
  is_closed: boolean;
}

export interface Booking {
  id: string;
  business_id: string;
  service_id: string;
  professional_id: string | null;
  client_id: string;
  booking_date: string;    // YYYY-MM-DD
  start_time: string;      // HH:MM:SS
  end_time: string;        // HH:MM:SS
  status: BookingStatus;
  notes: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  business_id: string;
  client_id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  rating: number | null;
  review: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  created_at: string;
}

// ─── Insert types (omit auto-generated fields) ───────────
export type ProfileInsert = Omit<Profile, 'created_at'>;
export type BusinessInsert = Omit<Business, 'id' | 'created_at'>;
export type ProductInsert = Omit<Product, 'id' | 'created_at'>;
export type ServiceInsert = Omit<Service, 'id'>;
export type ProfessionalInsert = Omit<Professional, 'id'>;
export type BusinessHoursInsert = Omit<BusinessHours, 'id'>;
export type BookingInsert = Omit<Booking, 'id' | 'created_at'>;
export type OrderInsert = Omit<Order, 'id' | 'created_at'>;
export type OrderItemInsert = Omit<OrderItem, 'id' | 'created_at'>;

// ─── Update types (all fields optional) ──────────────────
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;
export type BusinessUpdate = Partial<Omit<Business, 'id' | 'owner_id' | 'created_at'>>;
export type ProductUpdate = Partial<Omit<Product, 'id' | 'business_id' | 'created_at'>>;
export type ServiceUpdate = Partial<Omit<Service, 'id' | 'business_id'>>;
export type ProfessionalUpdate = Partial<Omit<Professional, 'id' | 'business_id'>>;
export type BusinessHoursUpdate = Partial<Omit<BusinessHours, 'id' | 'business_id'>>;
export type BookingUpdate = Partial<Omit<Booking, 'id' | 'business_id' | 'created_at'>>;
export type OrderUpdate = Partial<Omit<Order, 'id' | 'business_id' | 'client_id' | 'created_at'>>;
export type OrderItemUpdate = Partial<Omit<OrderItem, 'id' | 'order_id' | 'created_at'>>;

// ─── Supabase Database type (for typed client) ───────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      businesses: {
        Row: Business;
        Insert: BusinessInsert;
        Update: BusinessUpdate;
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      services: {
        Row: Service;
        Insert: ServiceInsert;
        Update: ServiceUpdate;
      };
      professionals: {
        Row: Professional;
        Insert: ProfessionalInsert;
        Update: ProfessionalUpdate;
      };
      business_hours: {
        Row: BusinessHours;
        Insert: BusinessHoursInsert;
        Update: BusinessHoursUpdate;
      };
      bookings: {
        Row: Booking;
        Insert: BookingInsert;
        Update: BookingUpdate;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: {
      checkout: {
        Args: {
          p_business_id: string;
          p_client_id: string;
          p_payment_method: string;
          p_items: any; // jsonb array
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      booking_status: BookingStatus;
      payment_method: PaymentMethod;
      order_status: OrderStatus;
    };
  };
}
