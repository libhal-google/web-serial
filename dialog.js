const options_btn = document.querySelector("#options-btn");
const options_dialog = document.querySelector("#options-dialog");
const close_options_dialog_btn = document.querySelector("#close-options-dialog-btn");

options_btn.addEventListener("click", async () => {
    options_dialog.showModal();
});

close_options_dialog_btn.addEventListener("click", async () => {
    options_dialog.close();
});

const help_btn = document.querySelector("#help-btn");
const help_dialog = document.querySelector("#help-dialog");
const close_help_dialog_btn = document.querySelector("#close-help-dialog-btn");

help_btn.addEventListener("click", async () => {
    help_dialog.showModal();
});

close_help_dialog_btn.addEventListener("click", async () => {
    help_dialog.close();
});

const upload_btn = document.querySelector("#upload-btn");
const upload_dialog = document.querySelector("#upload-dialog");
const close_upload_dialog_btn = document.querySelector("#close-upload-dialog-btn");

upload_btn.addEventListener("click", async () => {
    upload_dialog.showModal();
});

close_upload_dialog_btn.addEventListener("click", async () => {
    upload_dialog.close();
});

