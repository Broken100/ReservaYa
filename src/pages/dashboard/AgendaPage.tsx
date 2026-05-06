import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useBookings } from '../../hooks/useBookings';
import { useBusiness } from '../../hooks/useBusiness';
import { generateCSV, downloadCSV } from '../../hooks/useExport';
import DayView from './agenda/DayView';
import MonthView from './agenda/MonthView';
import YearView from './agenda/YearView';
import PendingAlerts from './agenda/PendingAlerts';
import type { BookingWithClient } from '../../types/database';

type ViewMode = 'day' | 'month' | 'year';

// ── Helpers ──────────────────────────────────────────────────
function toLocalDate(dateStr: string) {
  const d = new Date(dateStr);
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
  return d;
}

function toLocalDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonthRange(year: number, month: number) {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const last = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  return { from, to };
}

function getYearRange(year: number) {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_HEADERS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ── Main Component ───────────────────────────────────────────
export default function AgendaPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();

  const today = new Date();
  const [view, setView] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(toLocalDateString(today));
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  
  // State for the slide-over panel
  const [selectedPeriod, setSelectedPeriod] = useState<{ type: 'day' | 'month', dateStr?: string, year?: number, month?: number } | null>(null);

  // ── Date ranges per view ─────────────────────────────────
  const monthRange = useMemo(() => getMonthRange(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const yearRange = useMemo(() => getYearRange(selectedYear), [selectedYear]);

  // ── Data hooks ───────────────────────────────────────────
  const dayBookings = useBookings({
    businessId: business?.id ?? null,
    date: view === 'day' ? selectedDate : undefined,
  });

  const monthBookings = useBookings({
    businessId: business?.id ?? null,
    dateFrom: view === 'month' ? monthRange.from : undefined,
    dateTo: view === 'month' ? monthRange.to : undefined,
  });

  const yearBookings = useBookings({
    businessId: business?.id ?? null,
    dateFrom: view === 'year' ? yearRange.from : undefined,
    dateTo: view === 'year' ? yearRange.to : undefined,
  });

  const { bookings: pendingBookings, confirmBooking: confirmPending, cancelBooking: cancelPending } = useBookings({
    businessId: business?.id ?? null,
    status: 'pending',
  });

  // ── Current bookings based on view ────────────────────────
  const current = view === 'day' ? dayBookings : view === 'month' ? monthBookings : yearBookings;
  const { bookings, loading, confirmBooking, cancelBooking, completeBooking, archiveBooking } = current;

  // ── Track recently actioned bookings for visual feedback ──
  const [actionedBookings, setActionedBookings] = useState<Record<string, 'confirmed' | 'cancelled'>>({});

  const handleConfirmPending = async (id: string) => {
    try {
      setActionedBookings(prev => ({ ...prev, [id]: 'confirmed' }));
      await confirmPending(id);
      setTimeout(() => setActionedBookings(prev => { const n = { ...prev }; delete n[id]; return n; }), 1500);
    } catch (err) {
      toast.error(t('agenda.errorConfirm'));
      setActionedBookings(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const handleCancelPending = async (id: string) => {
    try {
      setActionedBookings(prev => ({ ...prev, [id]: 'cancelled' }));
      await cancelPending(id);
      setTimeout(() => setActionedBookings(prev => { const n = { ...prev }; delete n[id]; return n; }), 1500);
    } catch (err) {
      toast.error(t('agenda.errorReject'));
      setActionedBookings(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  // ── Navigation handlers ──────────────────────────────────
  const handlePrev = () => {
    if (view === 'day') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(toLocalDateString(d));
    } else if (view === 'month') {
      if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
      else setSelectedMonth(m => m - 1);
    } else {
      setSelectedYear(y => y - 1);
    }
  };

  const handleNext = () => {
    if (view === 'day') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(toLocalDateString(d));
    } else if (view === 'month') {
      if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
      else setSelectedMonth(m => m + 1);
    } else {
      setSelectedYear(y => y + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setSelectedDate(toLocalDateString(now));
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  // ── Current period label ─────────────────────────────────
  const periodLabel = useMemo(() => {
    if (view === 'day') {
      const d = toLocalDate(selectedDate);
      return d.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (view === 'month') return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    return `${selectedYear}`;
  }, [view, selectedDate, selectedMonth, selectedYear]);

  // ── Loading state ────────────────────────────────────────
  if (loading && bookings.length === 0 && pendingBookings.length === 0) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* ── Pending Alerts ──────────────────────────────── */}
      <PendingAlerts
        pendingBookings={pendingBookings}
        selectedDate={selectedDate}
        actionedBookings={actionedBookings}
        onConfirm={handleConfirmPending}
        onCancel={handleCancelPending}
      />

      {/* ── Header: Title + View Tabs + Navigation ────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">{t('dashboard.agenda')}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (bookings.length === 0) return;
                  const csv = generateCSV(
                    bookings.map(b => ({
                      client_name: b.client?.full_name || '',
                      service_name: b.services?.name || '',
                      booking_date: b.booking_date,
                      start_time: b.start_time?.slice(0, 5) || '',
                      status: b.status,
                      payment_method: b.payment_method,
                    })),
                    [
                      { key: 'client_name', label: 'Cliente' },
                      { key: 'service_name', label: 'Servicio' },
                      { key: 'booking_date', label: 'Fecha' },
                      { key: 'start_time', label: 'Hora' },
                      { key: 'status', label: 'Estado' },
                      { key: 'payment_method', label: 'Método de Pago' },
                    ]
                  );
                  downloadCSV(csv, `reservas-${new Date().toISOString().slice(0, 10)}.csv`);
                }}
                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
                title="Exportar CSV"
              >
                <Download size={18} />
              </button>
            </div>
          <div className="flex items-center gap-2 bg-dark-card rounded-xl border border-white/5 p-1">
            {(['day', 'month', 'year'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === v ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {v === 'day' ? t('agenda.view.day') : v === 'month' ? t('agenda.view.month') : t('agenda.view.year')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handlePrev} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <p className="text-gray-200 font-semibold min-w-[200px] text-center capitalize">{periodLabel}</p>
            <button onClick={handleNext} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
              <ChevronRight size={20} />
            </button>
            <button onClick={handleToday} className="ml-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors border border-blue-500/20">
              {t('agenda.today')}
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-blue-600/10 px-4 py-2 rounded-xl border border-blue-500/20">
            <Calendar size={16} className="text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">{t('agenda.bookingsCount', { count: bookings.length })}</span>
          </div>
        </div>
      </div>

      {/* ── View Content ────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
      ) : (
        <>
          {view === 'day' && <DayView bookings={bookings} confirmBooking={confirmBooking} cancelBooking={cancelBooking} completeBooking={completeBooking} archiveBooking={archiveBooking} />}
          {view === 'month' && (
            <MonthView
              bookings={bookings}
              year={selectedYear}
              month={selectedMonth}
              selectedDate={selectedDate}
              onOpenDetails={(d) => setSelectedPeriod({ type: 'day', dateStr: d })}
            />
          )}
          {view === 'year' && (
            <YearView
              bookings={bookings}
              year={selectedYear}
              onOpenDetails={(m) => setSelectedPeriod({ type: 'month', year: selectedYear, month: m })}
            />
          )}
        </>
      )}

      {selectedPeriod && (
        <PeriodDetailsPanel
          period={selectedPeriod}
          businessId={business?.id ?? ''}
          onClose={() => setSelectedPeriod(null)}
          onNavigate={() => {
            if (selectedPeriod.type === 'day' && selectedPeriod.dateStr) {
              setSelectedDate(selectedPeriod.dateStr);
              setView('day');
            } else if (selectedPeriod.type === 'month' && selectedPeriod.month !== undefined) {
              setSelectedMonth(selectedPeriod.month);
              setSelectedYear(selectedPeriod.year!);
              setView('month');
            }
            setSelectedPeriod(null);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ── Period Details Panel (Slide-over) ────────────────────────
// ═══════════════════════════════════════════════════════════════
function PeriodDetailsPanel({ period, businessId, onClose, onNavigate }: { 
  period: { type: 'day' | 'month', dateStr?: string, year?: number, month?: number };
  businessId: string;
  onClose: () => void;
  onNavigate: () => void;
}) {
  const { t } = useTranslation();
  const MONTH_NAMES = t('agenda.months', { returnObjects: true }) as string[];
  const isDay = period.type === 'day';
  
  let dateFrom: string | undefined;
  let dateTo: string | undefined;
  let exactDate: string | undefined;
  let title = '';

  if (isDay) {
    exactDate = period.dateStr;
    const d = toLocalDate(exactDate!);
    title = d.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } else {
    const { from, to } = getMonthRange(period.year!, period.month!);
    dateFrom = from;
    dateTo = to;
    title = `${MONTH_NAMES[period.month!]} ${period.year}`;
  }

  const { bookings, loading, confirmBooking, cancelBooking, completeBooking } = useBookings({
    businessId,
    date: exactDate,
    dateFrom,
    dateTo
  });

  const { archiveBooking } = useBookings({ businessId });

  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action();
    } catch (err: unknown) {
      toast.error(`Error: ${err instanceof Error ? err.message : t('agenda.errorAction')}`);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-dark-bg border-l border-white/10 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex flex-col gap-4 bg-dark-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white capitalize">{title}</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
          <button 
            onClick={onNavigate}
            className="flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 w-full py-3 rounded-xl text-sm font-bold transition-colors"
          >
            <Calendar size={16} />
            {isDay ? t('agenda.goToDayView') : t('agenda.goToMonthView')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-gray-500 py-10">{t('agenda.noBookingsForPeriod')}</p>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <div key={booking.id} className="bg-dark-card border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_STYLES[booking.status]}`}>
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>
                  
                  <div>
                    {/* Client Info */}
                    <div className="flex items-center gap-2 mb-2">
                      {booking.client?.avatar_url ? (
                        <img src={booking.client.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-[9px] font-bold">
                          {(booking.client?.full_name || '?')[0]}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-300">{booking.client?.full_name || t('agenda.client')}</span>
                    </div>

                    <p className="text-white font-medium text-sm">{booking.services?.name || t('agenda.service')}</p>
                    <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5">
                      <Clock size={12} />
                      {!isDay && `${new Date(`${booking.booking_date}T${booking.start_time}`).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })} • `}
                      {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-2 pt-3 border-t border-white/5">
                    <button onClick={() => handleAction(() => archiveBooking(booking.id), 'archivada')} className="flex-1 py-2 bg-gray-600/20 hover:bg-gray-600/40 text-gray-400 text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1">
                      <ArchiveIcon size={14} /> {t('agenda.archive')}
                    </button>
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <>
                        {booking.status === 'pending' && (
                          <button onClick={() => handleAction(() => confirmBooking(booking.id), 'confirmada')} className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1">
                            <CheckCircle size={14} /> {t('agenda.confirm')}
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button onClick={() => handleAction(() => completeBooking(booking.id), 'completada')} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1">
                            <CheckCircle size={14} /> {t('agenda.complete')}
                          </button>
                        )}
                        <button onClick={() => handleAction(() => cancelBooking(booking.id), 'cancelada')} className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1">
                          <XCircle size={14} /> Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ArchiveIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  );
}
