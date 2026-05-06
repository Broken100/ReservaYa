import { describe, it, expect } from 'vitest';
import { validateForm, businessSetupSchema, serviceSchema, productSchema, bookingSchema } from '../lib/validation';

describe('validateForm', () => {
  it('returns success for valid business setup', () => {
    const result = validateForm(businessSetupSchema, {
      name: 'Mi Negocio',
      category: 'Peluquería',
    });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Mi Negocio');
  });

  it('returns error for empty name', () => {
    const result = validateForm(businessSetupSchema, {
      name: '',
      category: 'Peluquería',
    });
    expect(result.success).toBe(false);
    expect(result.errors?.name).toBeDefined();
  });

  it('returns error for short name', () => {
    const result = validateForm(businessSetupSchema, {
      name: 'A',
      category: 'Peluquería',
    });
    expect(result.success).toBe(false);
    expect(result.errors?.name).toContain('2 caracteres');
  });

  it('validates service with valid data', () => {
    const result = validateForm(serviceSchema, {
      name: 'Corte de Cabello',
      duration_minutes: 30,
      price: 15,
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects service with negative price', () => {
    const result = validateForm(serviceSchema, {
      name: 'Corte',
      duration_minutes: 30,
      price: -5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects service with duration too long', () => {
    const result = validateForm(serviceSchema, {
      name: 'Corte',
      duration_minutes: 500,
      price: 10,
    });
    expect(result.success).toBe(false);
  });

  it('validates product with stock', () => {
    const result = validateForm(productSchema, {
      name: 'Shampoo',
      price: 12.99,
      stock: 50,
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects product with negative stock', () => {
    const result = validateForm(productSchema, {
      name: 'Shampoo',
      price: 12.99,
      stock: -1,
    });
    expect(result.success).toBe(false);
  });

  it('validates booking with correct format', () => {
    const result = validateForm(bookingSchema, {
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      booking_date: '2026-05-15',
      start_time: '10:00:00',
      end_time: '10:30:00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects booking with invalid date format', () => {
    const result = validateForm(bookingSchema, {
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      booking_date: '15/05/2026',
      start_time: '10:00:00',
      end_time: '10:30:00',
    });
    expect(result.success).toBe(false);
  });
});
