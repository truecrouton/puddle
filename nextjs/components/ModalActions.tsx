interface ModalActionsProps {
    isPending: boolean;
    onClose: () => void;
}

export default function ModalActions({ isPending, onClose }: ModalActionsProps) {
    return (
        <div className="modal-action">
            <button type="button" className="btn btn-soft btn-error" onClick={onClose}>
                Cancel
            </button>
            <button type="submit" className={`btn btn-primary ${isPending ? 'loading' : ''}`}>
                {isPending ? 'Saving...' : 'Submit'}
            </button>
        </div>
    );
}