import { z } from 'zod';

// ── Auth / Profile ──────────────────────────────────────────
export const profileSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
});

// ── Business ─────────────────────────────────────────────────
export const businessSetupSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  category: z.string().min(1, 'Selecciona una categoría'),
  customCategory: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
});

export const businessSettingsSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  whatsapp_number: z.string().optional(),
  google_maps_url: z.string().url('URL inválida').optional().or(z.literal('')),
  enable_products: z.boolean().optional(),
  show_socials: z.boolean().optional(),
  show_services: z.boolean().optional(),
  show_products: z.boolean().optional(),
});

// ── Service ──────────────────────────────────────────────────
export const serviceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  description: z.string().max(500).optional(),
  duration_minutes: z.number().int().min(5, 'Mínimo 5 minutos').max(480, 'Máximo 8 horas'),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  currency: z.string().default('USD'),
  is_active: z.boolean().default(true),
});

// ── Professional ─────────────────────────────────────────────
export const professionalSchema = z.object({
  name: z.string().min(2).max(100),
  specialty: z.string().max(100).optional(),
  is_active: z.boolean().default(true),
});

// ── Product ──────────────────────────────────────────────────
export const productSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  is_active: z.boolean().default(true),
});

// ── Booking ──────────────────────────────────────────────────
export const bookingSchema = z.object({
  service_id: z.string().uuid(),
  professional_id: z.string().uuid().optional(),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  start_time: z.string(),
  end_time: z.string(),
  notes: z.string().max(500).optional(),
});

// ── Order / Checkout ─────────────────────────────────────────
export const checkoutItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
});

export const checkoutSchema = z.object({
  business_id: z.string().uuid(),
  client_id: z.string().uuid(),
  payment_method: z.enum(['cash', 'transfer']),
  items: z.array(checkoutItemSchema).min(1, 'Agrega al menos un producto'),
});

// ── Helper ───────────────────────────────────────────────────
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return { success: false, errors };
}
