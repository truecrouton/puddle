import { post } from "superagent";

export function callApi(endpoint: string, query: any) {
    const host = `${window.location.protocol}//${window.location.host}`;

    const modal = document.querySelector('.modal.show');
    const modalSpinner = modal?.querySelector('.spinner-border');
    modalSpinner?.classList.remove('d-none');
    const modalAlert = modal?.querySelector('.pdl-error-modal');
    const pageAlert = document.querySelector('.pdl-error-page');

    modalAlert?.classList.add('d-none');
    pageAlert?.classList.add('d-none');

    return new Promise((resolve) => {
        post(`${host}/api${endpoint}`)
            .send(query)
            .then((res) => {
                modalSpinner?.classList.add('d-none');
                resolve(res.body);
            })
            .catch((error) => {
                if (error.response.statusCode === 401) {
                    window.location.href = './login.html';
                }

                modalSpinner?.classList.add('d-none');

                if (modalAlert) {
                    modalAlert.innerHTML = error.response.body?.message ?? 'An unknown error occurred.';
                    modalAlert?.classList.remove('d-none');
                }
                else if (pageAlert) {
                    pageAlert.innerHTML = error.response.body?.message ?? 'An unknown error occurred.';
                    pageAlert?.classList.remove('d-none');
                }
            });
    });
}

export function autoResetModals() {
    document.querySelectorAll('.modal').forEach((modal: HTMLElement) => modal.addEventListener('show.bs.modal', () => {
        const alerts = modal.getElementsByClassName('pdl-error-modal');
        Array.from(alerts).forEach((alert: HTMLElement) => alert.classList.add('d-none'));

        const spinner = modal.querySelector('.spinner-border');
        spinner?.classList.add('d-none');

        const forms = modal.getElementsByTagName('form');
        Array.from(forms).forEach((form: HTMLFormElement) => {
            form.reset();
            form.classList.remove('was-validated');
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