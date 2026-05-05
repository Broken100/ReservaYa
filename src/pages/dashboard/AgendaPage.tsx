import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight, X, User, Phone, Archive } from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import { useBusiness } from '../../hooks/useBusiness';
import type { Booking } from '../../types/database';

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
      // Card stays visible with green state for 1.5s then fades
      setTimeout(() => setActionedBookings(prev => { const n = { ...prev }; delete n[id]; return n; }), 1500);
    } catch (err) {
      alert('Error al confirmar reserva. Por favor intente nuevamente.');
      setActionedBookings(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const handleCancelPending = async (id: string) => {
    try {
      setActionedBookings(prev => ({ ...prev, [id]: 'cancelled' }));
      await cancelPending(id);
      setTimeout(() => setActionedBookings(prev => { const n = { ...prev }; delete n[id]; return n; }), 1500);
    } catch (err) {
      alert('Error al rechazar reserva. Por favor intente nuevamente.');
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

  // ── Pending bookings from other dates ────────────────────
  const visiblePendingBookings = pendingBookings.filter(b => 
    b.booking_date !== selectedDate && (b.status === 'pending' || actionedBookings[b.id])
  );

  // ── Loading state ────────────────────────────────────────
  if (loading && bookings.length === 0 && pendingBookings.length === 0) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* ── Pending Alerts ──────────────────────────────── */}
      {visiblePendingBookings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
          <h2 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
            <Clock size={20} />
            Citas pendientes de confirmación ({visiblePendingBookings.filter(b => b.status === 'pending' && !actionedBookings[b.id]).length})
          </h2>
          <div className="space-y-3">
            {visiblePendingBookings.map((booking) => {
              const action = actionedBookings[booking.id];
              return (
                <div
                  key={booking.id}
                  className={`rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all duration-500 ${
                    action === 'confirmed'
                      ? 'bg-green-600/10 border-green-500/30 scale-[0.98] opacity-80'
                      : action === 'cancelled'
                      ? 'bg-red-600/10 border-red-500/30 scale-[0.98] opacity-80'
                      : 'bg-dark-card border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {action && (
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        action === 'confirmed' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {action === 'confirmed'
                          ? <CheckCircle size={18} className="text-green-400" />
                          : <XCircle size={18} className="text-red-400" />
                        }
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold">
                        {action
                          ? action === 'confirmed' ? '✓ Cita confirmada' : '✗ Cita rechazada'
                          : `${toLocalDate(booking.booking_date).toLocaleDateString('es-EC', { weekday: 'long', month: 'long', day: 'numeric' })} a las ${booking.start_time.slice(0, 5)}`
                        }
                      </p>
                      <p className="text-gray-400 text-sm">{booking.services?.name || 'Servicio'}</p>
                    </div>
                  </div>
                  {!action && (
                    <div className="flex gap-2">
                      <button onClick={() => handleConfirmPending(booking.id)} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition-colors">Confirmar</button>
                      <button onClick={() => handleCancelPending(booking.id)} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-bold rounded-lg transition-colors">Rechazar</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Header: Title + View Tabs + Navigation ────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">{t('dashboard.agenda')}</h1>
          <div className="flex items-center gap-2 bg-dark-card rounded-xl border border-white/5 p-1">
            {(['day', 'month', 'year'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === v ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {v === 'day' ? 'Día' : v === 'month' ? 'Mes' : 'Año'}
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
              Hoy
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-blue-600/10 px-4 py-2 rounded-xl border border-blue-500/20">
            <Calendar size={16} className="text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">{bookings.length} citas</span>
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
// ── Day View ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
function DayView({ bookings, confirmBooking, cancelBooking, completeBooking }: {
  bookings: Booking[];
  confirmBooking: (id: string) => void;
  cancelBooking: (id: string) => void;
  completeBooking: (id: string) => void;
  archiveBooking: (id: string) => void;
}) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-20 bg-dark-card rounded-3xl border border-white/5">
        <Calendar size={48} className="text-gray-700 mx-auto mb-4" />
        <p className="text-gray-500">No hay reservas para esta fecha</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-dark-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-5">
            <div className="bg-white/5 p-3 rounded-xl shrink-0 mt-1">
              <Clock size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</p>
              
              {/* Client Info */}
              <div className="flex items-center gap-3 mb-2">
                {(booking as any).client?.avatar_url ? (
                  <img src={(booking as any).client.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-[10px] font-bold">
                    {((booking as any).client?.full_name || '?')[0]}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-300">{(booking as any).client?.full_name || 'Cliente'}</span>
                {(booking as any).client?.phone && (
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10}/> {(booking as any).client.phone}</span>
                )}
              </div>

              <p className="text-gray-500 text-sm flex gap-2 items-center">
                <span className="text-blue-400/80">{booking.services?.name || 'Servicio'}</span>
              </p>
              {booking.notes && (
                <p className="text-xs text-gray-400 italic mt-2">"{booking.notes}"</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${STATUS_STYLES[booking.status] || ''}`}>
              {STATUS_LABELS[booking.status] || booking.status}
            </span>
            <div className="flex gap-1">
              <button onClick={async () => {
                if (window.confirm('¿Archivar esta cita?')) {
                  try { await archiveBooking(booking.id); } catch(e) {}
                }
              }} className="p-2 rounded-lg hover:bg-gray-600/10 text-gray-500 hover:text-gray-400 transition-colors" title="Archivar">
                <Archive size={18} />
              </button>
              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <>
                  {booking.status === 'pending' && (
                    <button onClick={() => confirmBooking(booking.id)} className="p-2 rounded-lg hover:bg-green-600/10 text-gray-500 hover:text-green-400 transition-colors" title="Confirmar">
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button onClick={() => completeBooking(booking.id)} className="p-2 rounded-lg hover:bg-blue-600/10 text-gray-500 hover:text-blue-400 transition-colors" title="Completar">
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button onClick={() => cancelBooking(booking.id)} className="p-2 rounded-lg hover:bg-red-600/10 text-gray-500 hover:text-red-400 transition-colors" title="Cancelar">
                    <XCircle size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ── Month View (Calendar Grid) ───────────────────────────────
// ═══════════════════════════════════════════════════════════════
function MonthView({ bookings, year, month, selectedDate, onOpenDetails }: {
  bookings: Booking[];
  year: number;
  month: number;
  selectedDate: string;
  onOpenDetails: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toLocalDateString(new Date());

  // Group bookings by day
  const bookingsByDay = useMemo(() => {
    const map: Record<number, Booking[]> = {};
    for (const b of bookings) {
      const day = parseInt(b.booking_date.split('-')[2], 10);
      if (!map[day]) map[day] = [];
      map[day].push(b);
    }
    return map;
  }, [bookings]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-dark-card rounded-3xl border border-white/5 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/5">
        {DAY_HEADERS.map(d => (
          <div key={d} className="py-3 text-center text-xs font-bold uppercase tracking-widest text-gray-600">{d}</div>
        ))}
      </div>
      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="border-b border-r border-white/[0.03] min-h-[100px]" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayBookings = bookingsByDay[day] || [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const pendingCount = dayBookings.filter(b => b.status === 'pending').length;
          const confirmedCount = dayBookings.filter(b => b.status === 'confirmed').length;

          return (
            <button
              key={day}
              onClick={() => onOpenDetails(dateStr)}
              className={`min-h-[100px] border-b border-r border-white/[0.03] p-2 text-left transition-all hover:bg-white/[0.03] group ${isSelected ? 'bg-blue-600/10' : ''}`}
            >
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold mb-1 ${
                isToday ? 'bg-blue-600 text-white' : 'text-gray-300 group-hover:text-white'
              }`}>
                {day}
              </span>
              {dayBookings.length > 0 && (
                <div className="space-y-1">
                  {pendingCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                      <span className="text-[10px] text-yellow-400 font-medium truncate">{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {confirmedCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                      <span className="text-[10px] text-green-400 font-medium truncate">{confirmedCount} confirmada{confirmedCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {dayBookings.length > pendingCount + confirmedCount && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0" />
                      <span className="text-[10px] text-gray-500 font-medium truncate">{dayBookings.length - pendingCount - confirmedCount} otra{dayBookings.length - pendingCount - confirmedCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ── Year View (12 Month Summary Cards) ───────────────────────
// ═══════════════════════════════════════════════════════════════
function YearView({ bookings, year, onOpenDetails }: {
  bookings: Booking[];
  year: number;
  onOpenDetails: (month: number) => void;
}) {
  const todayMonth = new Date().getMonth();
  const todayYear = new Date().getFullYear();

  // Group bookings by month
  const bookingsByMonth = useMemo(() => {
    const map: Record<number, { total: number; pending: number; confirmed: number; completed: number; cancelled: number }> = {};
    for (let m = 0; m < 12; m++) map[m] = { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const b of bookings) {
      const m = parseInt(b.booking_date.split('-')[1], 10) - 1;
      if (map[m]) {
        map[m].total++;
        if (b.status === 'pending') map[m].pending++;
        else if (b.status === 'confirmed') map[m].confirmed++;
        else if (b.status === 'completed') map[m].completed++;
        else if (b.status === 'cancelled') map[m].cancelled++;
      }
    }
    return map;
  }, [bookings]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {MONTH_NAMES.map((name, i) => {
        const data = bookingsByMonth[i];
        const isCurrent = i === todayMonth && year === todayYear;
        const maxCount = Math.max(...Object.values(bookingsByMonth).map(d => d.total), 1);
        const barWidth = data.total > 0 ? Math.max((data.total / maxCount) * 100, 8) : 0;

        return (
          <button
            key={name}
            onClick={() => onOpenDetails(i)}
            className={`bg-dark-card rounded-2xl p-5 border transition-all hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 text-left group ${
              isCurrent ? 'border-blue-500/30 ring-1 ring-blue-500/10' : 'border-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-bold ${isCurrent ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'} transition-colors`}>
                {name}
              </span>
              <span className="text-2xl font-bold text-white">{data.total}</span>
            </div>

            {/* Activity bar */}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>

            {/* Status breakdown */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {data.confirmed > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />{data.confirmed}
                </span>
              )}
              {data.pending > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] text-yellow-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />{data.pending}
                </span>
              )}
              {data.completed > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] text-blue-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{data.completed}
                </span>
              )}
              {data.cancelled > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] text-red-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />{data.cancelled}
                </span>
              )}
              {data.total === 0 && <span className="text-[10px] text-gray-600">Sin citas</span>}
            </div>
          </button>
        );
      })}
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

  const { archiveBooking } = useBookings({ businessId }); // for the archive function

  const handleAction = async (action: () => Promise<any>, successMsg: string) => {
    try {
      await action();
    } catch (err: any) {
      alert(`Error: ${err.message || 'No se pudo realizar la acción'}`);
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
            {isDay ? 'Ir a la vista de Día' : 'Ir a la vista de Mes'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No hay reservas para este periodo.</p>
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
                      {(booking as any).client?.avatar_url ? (
                        <img src={(booking as any).client.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-[9px] font-bold">
                          {((booking as any).client?.full_name || '?')[0]}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-300">{(booking as any).client?.full_name || 'Cliente'}</span>
                    </div>

                    <p className="text-white font-medium text-sm">{booking.services?.name || 'Servicio'}</p>
                    <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5">
                      <Clock size={12} />
                      {!isDay && `${new Date(`${booking.booking_date}T${booking.start_time}`).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })} • `}
                      {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-2 pt-3 border-t border-white/5">
                    <button onClick={() => handleAction(() => archiveBooking(booking.id), 'archivada')} className="flex-1 py-2 bg-gray-600/20 hover:bg-gray-600/40 text-gray-400 text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1">
                      <Archive size={14} /> Archivar
                    </button>
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <>
                        {booking.status === 'pending' && (
                          <button onClick={() => handleAction(() => confirmBooking(booking.id), 'confirmada')} className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1">
                            <CheckCircle size={14} /> Confirmar
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button onClick={() => handleAction(() => completeBooking(booking.id), 'completada')} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-1">
                            <CheckCircle size={14} /> Completar
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
