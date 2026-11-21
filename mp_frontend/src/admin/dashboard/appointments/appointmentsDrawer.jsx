import MpCalenderAdmin from '../contact/mpCalenderAdmin/mpCalenderAdmin';
import './appointments.css';

export default function AppointmentsDrawer({
  isOpen,
  onClose,
  onOpenCalendarView,
  onPendingCountChange,
}) {
  if (!isOpen) return null;

  return (
    <MpCalenderAdmin
      isDrawer={true}
      onClose={onClose}
      onOpenCalendarView={onOpenCalendarView}
      onPendingCountChange={onPendingCountChange}
    />
  );
}

export { AppointmentsDrawer };
