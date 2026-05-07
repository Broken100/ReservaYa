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
  chosen_role: UserRole | null;
  selected_plan_id: string | null;
  payment_status: 'pending' | 'active' | 'inactive';
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  google_maps_url: string | null;
  whatsapp_number: string | null;
  whatsapp_direct: boolean | null;
  qr_code_url: string | null;
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
  category: string | null;
  key_features: string[] | null;
  instructions: string | null;
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
  category: string | null;
  duration_display: string | null;
  whats_included: string | null;
  recommendations: string | null;
  requires_pro: boolean;
}

export interface Professional {
  id: string;
  business_id: string;
  name: string;
  full_name: string | null;
  specialty: string | null;
  position: string | null;
  avatar_url: string | null;
  is_active: boolean;
  years_experience: number | null;
  bio: string | null;
  featured_services: string[] | null;
  slogan: string | null;
  availability_notes: string | null;
  social_links: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    twitter?: string;
  } | null;
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
  payment_method: PaymentMethod;
  notes: string | null;
  rating: number | null;
  review: string | null;
  is_archived: boolean;
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
  is_archived: boolean;
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

// ─── Extended types (for joined queries) ──────────────────
export interface BookingWithClient extends Booking {
  client?: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  services?: {
    name: string;
    price: number;
    image_url: string | null;
    description: string | null;
    duration_minutes: number;
  } | null;
  businesses?: {
    id: string;
    name: string;
    settings?: Record<string, any> | null;
  } | null;
  professionals?: {
    name: string;
    avatar_url: string | null;
    specialty: string | null;
  } | null;
}

export interface OrderWithClient extends Order {
  client?: {
    avatar_url: string | null;
    full_name: string | null;
  } | null;
  items?: {
    product?: {
      name: string;
      image_url: string | null;
    } | null;
    quantity: number;
    unit_price: number;
  }[];
}

export interface ClientInfo {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  booking_count: number;
  order_count: number;
  last_activity: string;
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  max_bookings_per_month: number | null;
  max_professionals: number | null;
  annual_discount_pct: number;
  features: string[];
  is_active: boolean;
  is_recommended: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  profile_id: string;
  plan_id: string;
  billing_period: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'expired';
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  profile_id: string;
  business_id: string | null;
  service_id: string | null;
  professional_id: string | null;
  product_id: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  client_id: string;
  target_type: 'business' | 'service' | 'professional' | 'product';
  target_id: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  hidden: boolean;
  featured: boolean;
  created_at: string;
}

export type BusinessSettings = NonNullable<Business['settings']>;

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
export type PlanInsert = Omit<Plan, 'created_at'>;
export type SubscriptionInsert = Omit<Subscription, 'id' | 'created_at'>;
export type PlanUpdate = Partial<Omit<Plan, 'id' | 'created_at'>>;
export type SubscriptionUpdate = Partial<Omit<Subscription, 'id' | 'profile_id' | 'created_at'>>;

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
      plans: {
        Row: Plan;
        Insert: PlanInsert;
        Update: PlanUpdate;
      };
      subscriptions: {
        Row: Subscription;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
      };
      favorites: {
        Row: Favorite;
        Insert: Omit<Favorite, 'id' | 'created_at'>;
        Update: Partial<Omit<Favorite, 'id' | 'profile_id' | 'created_at'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at'>;
        Update: Partial<Omit<Review, 'id' | 'business_id' | 'client_id' | 'created_at'>>;
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
      activate_subscription: {
        Args: {
          p_profile_id: string;
          p_plan_id: string;
          p_billing_period: string;
        };
        Returns: string;
      };
      check_booking_limit: {
        Args: {
          p_business_id: string;
        };
        Returns: { can_book: boolean; remaining: number; limit_type: string };
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
