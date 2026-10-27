'use client';

import ErrorAlert from './ErrorAlert';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    alertErrors: (string | null | undefined)[];
    children: React.ReactNode;
}

export default function BaseModal({ isOpen, onClose, title, alertErrors, children }: BaseModalProps) {
    return (
        <dialog id="device_modal" onClose={onClose} className="modal modal-bottom sm:modal-middle" open={isOpen}>
            <div className="modal-box w-11/12 max-w-4xl">
                <h3 className="font-bold text-lg pb-4">{title}</h3>
                <ErrorAlert message={alertErrors.filter((error) => Boolean(error)).join(' ')} />
                {children}
                <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                </form>
            </div>
        </dialog>
    );
}