import BookingConfirmation from '../../../components/booking/BookingConfirmation';
import type { Business, Service, Professional } from '../../../types/database';

interface ThemeColor {
  [key: string]: string;
}

interface ConfirmationStepProps {
  business: Business;
  service: Service;
  professional: Professional | null;
  date: Date;
  time: string;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
  tColor: ThemeColor;
}

export default function ConfirmationStep({ business, service, professional, date, time, onConfirm, onBack, loading, tColor }: ConfirmationStepProps) {
  return (
    <BookingConfirmation
      business={business}
      service={service}
      professional={professional}
      date={date}
      time={time}
      onConfirm={onConfirm}
      onBack={onBack}
      loading={loading}
      tColor={tColor}
    />
  );
}
