import { post } from "superagent";

export function callApi(endpoint: string, query: any) {
    const host = `${window.location.protocol}//${window.location.host}`;

    const modal = <HTMLDialogElement>document.querySelector('dialog[open]');
    const modalSpinner = modal?.querySelector('.loading');
    modalSpinner?.classList.remove('hidden');
    const modalAlert = modal?.querySelector('.pdl-error-modal');
    const pageAlert = document.querySelector('.pdl-error-page');

    modalAlert?.classList.add('hidden');
    if (pageAlert) pageAlert.classList.add('hidden');

    return new Promise((resolve) => {
        post(`${host}/api${endpoint}`)
            .send(query)
            .then((res) => {
                modalSpinner?.classList.add('hidden');
                resolve(res.body);
            })
            .catch((error) => {
                if (error.response.statusCode === 401) {
                    window.location.href = './login.html';
                }

                modalSpinner?.classList.add('hidden');

                if (modalAlert) {
                    modalAlert.innerHTML = error.response.body?.message ?? 'An unknown error occurred.';
                    modalAlert?.classList.remove('hidden');
                }
                else if (pageAlert) {
                    pageAlert.innerHTML = error.response.body?.message ?? 'An unknown error occurred.';
                    pageAlert?.classList.remove('hidden');
                }
            });
    });
}

export function autoResetModals() {
    document.querySelectorAll('dialog').forEach((modal: HTMLDialogElement) => modal.addEventListener('close', () => {
        const alerts = modal.getElementsByClassName('pdl-error-modal');
        Array.from(alerts).forEach((alert: HTMLElement) => alert.classList.add('hidden'));

        const spinner = modal.querySelector('.loading');
        spinner?.classList.add('hidden');

        const forms = modal.getElementsByTagName('form');
        Array.from(forms).forEach((form: HTMLFormElement) => {
            if (form.getAttribute('method') !== 'dialog') {
                form.reset();
                form.classList.remove('was-validated');
            }
        });
    }));
}

export function capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
};

export function sort(data: {}[], over: string, desc: boolean = false) {
    if (!data) return null;

    if (desc) data.sort((a, b) => String(a[over]).toLowerCase() < String(b[over]).toLowerCase() ? 1 : -1);
    else data.sort((a, b) => String(a[over]).toLowerCase() < String(b[over]).toLowerCase() ? -1 : 1);
    return data;
}