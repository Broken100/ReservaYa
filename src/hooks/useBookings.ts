import { useState, useEffect, useCallback, useId } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Booking, BookingInsert, BookingUpdate, BookingWithClient } from '../types/database';

interface UseBookingsOptions {
  businessId?: string | null;
  clientId?: string | null;
  date?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  status?: string | null;
  archived?: boolean;
}

export function useBookings({ businessId, clientId, date, dateFrom, dateTo, status, archived }: UseBookingsOptions = {}) {
  const hookId = useId();
  const [bookings, setBookings] = useState<BookingWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('bookings').select('*, services(name, price), businesses(name), professionals(name), client:profiles!bookings_client_id_fkey(id, full_name, email, phone, avatar_url)')
      .eq('is_archived', archived ? true : false);

    if (businessId) query = query.eq('business_id', businessId);
    if (clientId) query = query.eq('client_id', clientId);
    if (date) query = query.eq('booking_date', date);
    if (dateFrom) query = query.gte('booking_date', dateFrom);
    if (dateTo) query = query.lte('booking_date', dateTo);
    if (status) query = query.eq('status', status);

    const { data, error: err } = await query.order('booking_date').order('start_time') as {
      data: BookingWithClient[] | null;
      error: { message: string } | null;
    };

    if (err) setError(err.message);
    else {
      const now = new Date().getTime();
      const filtered = (data as BookingWithClient[]).filter(b => {
        if (b.status === 'cancelled') {
          const bookingTime = new Date(b.created_at).getTime();
          if (now - bookingTime > 24 * 60 * 60 * 1000) return false;
        }
        return true;
      });
      setBookings(filtered);
    }
    setLoading(false);
  }, [businessId, clientId, date, dateFrom, dateTo, status, archived]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Realtime subscription for business bookings
  useEffect(() => {
    if (!businessId) return;

    const channelName = `bookings-${hookId}-${businessId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `business_id=eq.${businessId}` },
        () => { fetchBookings(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hookId, businessId, fetchBookings]);

  const createBooking = async (booking: BookingInsert) => {
    setError(null);
    try {
      const { data: limitCheck, error: limitErr } = await supabase
        .rpc('check_booking_limit', { p_business_id: booking.business_id });

      if (limitErr) {
        console.warn('[useBookings] Limit check error, proceeding:', limitErr.message);
      } else if (limitCheck && !limitCheck.can_book) {
        throw new Error('PLAN_BOOKING_LIMIT');
      }

      // 1. Basic validation: cannot book in the past
      const bookingStart = new Date(`${booking.booking_date}T${booking.start_time}`);
      if (bookingStart < new Date()) {
        throw new Error('No puedes reservar en una fecha u hora pasada');
      }

      // 2. Check business hours (parse date as local to avoid UTC timezone shift)
      const [bYear, bMonth, bDay] = booking.booking_date.split('-').map(Number);
      const dayOfWeek = new Date(bYear, bMonth - 1, bDay).getDay();
      const { data: hours } = await supabase
        .from('business_hours')
        .select('*')
        .eq('business_id', booking.business_id)
        .eq('day_of_week', dayOfWeek)
        .single();

      if (!hours || hours.is_closed) {
        throw new Error('El negocio está cerrado en el día seleccionado');
      }

      if (booking.start_time < hours.open_time || booking.end_time > hours.close_time) {
        throw new Error('La reserva está fuera del horario de atención');
      }

      // 3. Check for overlaps (Double booking prevention)
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('business_id', booking.business_id)
        .eq('booking_date', booking.booking_date)
        .eq('professional_id', booking.professional_id)
        .neq('status', 'cancelled')
        .or(`and(start_time.lte.${booking.start_time},end_time.gt.${booking.start_time}),and(start_time.lt.${booking.end_time},end_time.gte.${booking.end_time}),and(start_time.gte.${booking.start_time},end_time.lte.${booking.end_time})`);

      if (existing && existing.length > 0) {
        throw new Error('El profesional ya tiene una reserva en este horario');
      }

      // 4. Proceed with insertion
      const { data, error: err } = await supabase
        .from('bookings')
        .insert(booking as never)
.select('*, services(name, price), businesses(name), professionals(name), client:profiles!bookings_client_id_fkey(id, full_name, email, phone, avatar_url)')
        .single() as { data: Booking | null; error: { message: string } | null };

      if (err) throw err;
      if (data) setBookings(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      console.error('[useBookings] Error creating booking:', err.message);
      setError(err.message);
      return null;
    }
  };

  const updateBooking = async (id: string, updates: BookingUpdate) => {
    const { data, error: err } = await supabase
      .from('bookings')
      .update(updates as never)
      .eq('id', id)
.select('*, services(name, price), businesses(name), professionals(name), client:profiles!bookings_client_id_fkey(id, full_name, email, phone, avatar_url)')
        .single() as { data: Booking | null; error: { message: string } | null };

    if (err) {
      setError(err.message); 
      throw new Error(err.message); 
    }
    if (data) setBookings(prev => prev.map(b => b.id === id ? data : b));
    return data;
  };

  const confirmBooking = (id: string) => updateBooking(id, { status: 'confirmed' });
  const cancelBooking = (id: string) => updateBooking(id, { status: 'cancelled' });
  const completeBooking = (id: string) => updateBooking(id, { status: 'completed' });
  
  const archiveBooking = async (id: string) => {
    const { error: err } = await supabase
      .from('bookings')
      .update({ is_archived: true })
      .eq('id', id);

    if (err) { setError(err.message); throw new Error(err.message); }
    setBookings(prev => prev.filter(b => b.id !== id));
    return true;
  };

  const restoreBooking = async (id: string) => {
    const { error: err } = await supabase
      .from('bookings')
      .update({ is_archived: false })
      .eq('id', id);

    if (err) { setError(err.message); throw new Error(err.message); }
    setBookings(prev => prev.filter(b => b.id !== id));
    return true;
  };

  return {
    bookings,
    loading,
    error,
    createBooking,
    updateBooking,
    confirmBooking,
    cancelBooking,
    completeBooking,
    archiveBooking,
    restoreBooking,
    refresh: fetchBookings,
  };
}
