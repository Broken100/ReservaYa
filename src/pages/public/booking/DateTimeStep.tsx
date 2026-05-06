import AvailabilityCalendar from '../../../components/booking/AvailabilityCalendar';

interface ThemeColor {
  [key: string]: string;
}

interface DateTimeStepProps {
  businessId: string;
  serviceId: string;
  professionalId: string | null;
  professionalsCount: number;
  onSelectTime: (date: Date, time: string) => void;
  onBack: () => void;
  tColor: ThemeColor;
}

export default function DateTimeStep({ businessId, serviceId, professionalId, professionalsCount, onSelectTime, onBack, tColor }: DateTimeStepProps) {
  return (
    <AvailabilityCalendar
      businessId={businessId}
      serviceId={serviceId}
      professionalId={professionalId}
      onSelectTime={onSelectTime}
      onBack={onBack}
      tColor={tColor}
    />
  );
}
