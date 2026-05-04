import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface TimeSlot {
  time: string;
  available: boolean;
}

export function useAvailability(businessId: string | null, serviceId: string | null, professionalId: string | null, date: Date | null) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAvailability() {
      if (!businessId || !serviceId || !date) {
        setSlots([]);
        return;
      }

      setLoading(true);
      try {
        const dayOfWeek = date.getDay();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        // 1. Get business hours for the selected day
        const { data: hoursData, error: hoursError } = await supabase
          .from('business_hours')
          .select('open_time, close_time, is_closed')
          .eq('business_id', businessId)
          .eq('day_of_week', dayOfWeek)
          .maybeSingle() as any;

        if (hoursError) throw hoursError;

        if (!hoursData || hoursData.is_closed) {
          setSlots([]);
          return;
        }

        // 2. Get service duration
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('duration_minutes')
          .eq('id', serviceId)
          .single() as any;

        if (serviceError) throw serviceError;
        const duration = serviceData?.duration_minutes || 30;

        // 3. Get existing bookings for the day
        let bookingsQuery = supabase
          .from('bookings')
          .select('start_time, end_time, status')
          .eq('business_id', businessId)
          .eq('booking_date', dateStr)
          .neq('status', 'cancelled');

        if (professionalId) {
          bookingsQuery = bookingsQuery.eq('professional_id', professionalId);
        }

        const { data: bookingsData, error: bookingsError } = await (bookingsQuery as any);

        if (bookingsError) throw bookingsError;

        // 4. Generate slots
        const generatedSlots: TimeSlot[] = [];
        const openTime = new Date(`1970-01-01T${hoursData.open_time}`);
        const closeTime = new Date(`1970-01-01T${hoursData.close_time}`);
        let currentTime = openTime;

        while (currentTime < closeTime) {
          const slotEndTime = new Date(currentTime.getTime() + duration * 60000);
          
          if (slotEndTime > closeTime) break;

          const startTimeStr = currentTime.toTimeString().substring(0, 5) + ':00';
          const endTimeStr = slotEndTime.toTimeString().substring(0, 5) + ':00';

          // Check if slot overlaps with any existing booking
          const isAvailable = !(bookingsData || []).some(booking => {
            return (
              (startTimeStr >= booking.start_time && startTimeStr < booking.end_time) ||
              (endTimeStr > booking.start_time && endTimeStr <= booking.end_time) ||
              (startTimeStr <= booking.start_time && endTimeStr >= booking.end_time)
            );
          });

          generatedSlots.push({
            time: startTimeStr.substring(0, 5),
            available: isAvailable
          });

          // Increment by duration (or could be a fixed interval like 30 mins)
          currentTime = new Date(currentTime.getTime() + duration * 60000);
        }

        setSlots(generatedSlots);
      } catch (err: any) {
        console.error("Error fetching availability:", err);
        setError(err);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailability();
  }, [businessId, serviceId, professionalId, date]);

  return { slots, loading, error };
}
