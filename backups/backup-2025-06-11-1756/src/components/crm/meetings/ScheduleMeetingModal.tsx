export const ScheduleMeetingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return isOpen ? (
    <div className="modal">
      <h2>Schedule Meeting</h2>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null;
};
