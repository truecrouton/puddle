interface ModalActionsProps {
    isPending: boolean;
    onClose: () => void;
    onDelete?: () => void;
}

export default function ModalActions({ isPending, onClose, onDelete }: ModalActionsProps) {
    return (
        <div className="modal-action">
            {onDelete && <button type="button" className="btn btn-error mr-auto" onClick={onDelete}>
                Delete
            </button>}

            <button type="button" className="btn btn-soft btn-error" onClick={onClose}>
                Cancel
            </button>
            <button type="submit" className={`btn btn-primary ${isPending ? 'loading' : ''}`}>
                {isPending ? 'Saving...' : 'Submit'}
            </button>
        </div>
    );
}