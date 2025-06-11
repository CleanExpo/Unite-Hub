export const AddClientModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return isOpen ? (
    <div className="modal">
      <h2>Add Client</h2>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null;
};
