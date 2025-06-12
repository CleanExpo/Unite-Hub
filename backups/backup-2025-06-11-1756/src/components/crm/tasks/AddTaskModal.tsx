export const AddTaskModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return isOpen ? (
    <div className="modal">
      <h2>Add Task</h2>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null;
};
