import { MonitorX } from "lucide-react";

interface ErrorAlertProps {
    message: string | undefined;
}

export default function ModalActions({ message }: ErrorAlertProps) {
    return (
        message && (<div role="alert" className="alert alert-error">
            <MonitorX className="h-6 w-6" />
            <span>{message}</span>
        </div>)
    );
}